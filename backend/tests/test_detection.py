"""
Unit tests for the detection engine and individual rules.
Tests use in-memory SQLite to avoid needing a running Postgres.
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.event import SecurityEvent, EventType, EventSeverity
from app.detection.engine import DetectionEngine
from app.detection.rules.brute_force import SSHBruteForceRule
from app.detection.rules.port_scan import PortScanRule
from app.detection.rules.suspicious_login import SuspiciousLoginRule
from app.detection.rules.auth_failure_burst import AuthFailureBurstRule


# -- Test DB setup --

@pytest.fixture(scope="function")
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(engine)


def _make_event(
    db,
    event_type=EventType.AUTHENTICATION_FAILURE,
    source_ip="10.0.0.1",
    service="ssh",
    username="admin",
    severity=EventSeverity.MEDIUM,
    processed=False,
    minutes_ago=0,
):
    event = SecurityEvent(
        source_ip=source_ip,
        event_type=event_type,
        severity=severity,
        service=service,
        username=username,
        processed=processed,
        timestamp=datetime.utcnow() - timedelta(minutes=minutes_ago),
        ingested_at=datetime.utcnow(),
    )
    db.add(event)
    db.flush()
    return event


# -- SSH Brute Force Tests --

class TestSSHBruteForceRule:
    def test_no_trigger_with_few_failures(self, db):
        rule = SSHBruteForceRule()
        for _ in range(3):  # Below threshold of 5
            _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        event = _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        result = rule.evaluate(event, db)
        assert result is None

    def test_triggers_at_threshold(self, db):
        rule = SSHBruteForceRule()
        for _ in range(5):
            _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        event = _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        result = rule.evaluate(event, db)
        assert result is not None
        assert result.triggered is True
        assert result.rule_name == "ssh_brute_force"
        assert result.severity == "high"

    def test_no_trigger_for_non_ssh(self, db):
        rule = SSHBruteForceRule()
        for _ in range(10):
            _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ftp")
        event = _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ftp")
        result = rule.evaluate(event, db)
        assert result is None

    def test_no_trigger_outside_window(self, db):
        rule = SSHBruteForceRule()
        # Events outside the 3-minute window
        for _ in range(10):
            _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh", minutes_ago=10)
        event = _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        result = rule.evaluate(event, db)
        assert result is None

    def test_risk_score_scales_with_failures(self, db):
        rule = SSHBruteForceRule()
        for _ in range(15):
            _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        event = _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        result = rule.evaluate(event, db)
        assert result is not None
        assert result.risk_score > 50  # Should be higher than base


# -- Port Scan Tests --

class TestPortScanRule:
    def test_triggers_on_scan_events(self, db):
        rule = PortScanRule()
        for _ in range(3):
            _make_event(db, EventType.PORT_SCAN, service=None)
        event = _make_event(db, EventType.PORT_SCAN, service=None)
        result = rule.evaluate(event, db)
        assert result is not None
        assert result.rule_name == "port_scan"
        assert result.severity == "medium"

    def test_no_trigger_with_few_scans(self, db):
        rule = PortScanRule()
        for _ in range(1):
            _make_event(db, EventType.PORT_SCAN)
        event = _make_event(db, EventType.PORT_SCAN)
        result = rule.evaluate(event, db)
        assert result is None

    def test_no_trigger_for_wrong_type(self, db):
        rule = PortScanRule()
        for _ in range(10):
            _make_event(db, EventType.AUTHENTICATION_FAILURE)
        event = _make_event(db, EventType.AUTHENTICATION_FAILURE)
        result = rule.evaluate(event, db)
        assert result is None


# -- Suspicious Login Tests --

class TestSuspiciousLoginRule:
    def test_triggers_on_direct_suspicious_login(self, db):
        rule = SuspiciousLoginRule()
        event = _make_event(db, EventType.SUSPICIOUS_LOGIN, service="vpn")
        result = rule.evaluate(event, db)
        assert result is not None
        assert result.severity == "high"

    def test_triggers_on_success_after_failures(self, db):
        rule = SuspiciousLoginRule()
        for _ in range(5):
            _make_event(db, EventType.AUTHENTICATION_FAILURE, minutes_ago=2)
        event = _make_event(db, EventType.AUTHENTICATION_SUCCESS, service="ssh")
        result = rule.evaluate(event, db)
        assert result is not None
        assert result.severity == "critical"

    def test_no_trigger_on_clean_success(self, db):
        rule = SuspiciousLoginRule()
        event = _make_event(db, EventType.AUTHENTICATION_SUCCESS)
        result = rule.evaluate(event, db)
        assert result is None


# -- Detection Engine Tests --

class TestDetectionEngine:
    def test_engine_creates_incident_on_brute_force(self, db):
        # Need the Incident model imported
        from app.models.incident import Incident

        engine = DetectionEngine()
        for _ in range(5):
            event = _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")

        # The 6th event should trigger the rule
        trigger_event = _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        incidents = engine.process_event(trigger_event, db)

        assert len(incidents) >= 1
        assert any(i.detection_rule == "ssh_brute_force" for i in incidents)
        assert trigger_event.processed is True

    def test_engine_deduplicates_incidents(self, db):
        from app.models.incident import Incident

        engine = DetectionEngine()
        # First trigger
        for _ in range(6):
            _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        event1 = _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        incidents1 = engine.process_event(event1, db)

        # Second trigger — should be suppressed (cooldown)
        for _ in range(6):
            _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        event2 = _make_event(db, EventType.AUTHENTICATION_FAILURE, service="ssh")
        incidents2 = engine.process_event(event2, db)

        # Second batch should not create a new brute force incident
        brute_force_in_second = [i for i in incidents2 if i.detection_rule == "ssh_brute_force"]
        assert len(brute_force_in_second) == 0
