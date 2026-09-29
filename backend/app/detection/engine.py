"""
Detection Engine — orchestrates all rules.
Called after every event ingestion to check for matches.
"""
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.event import SecurityEvent
from app.models.incident import Incident, IncidentSeverity, IncidentStatus
from app.detection.rules.base import BaseDetectionRule, DetectionResult
from app.detection.rules.brute_force import SSHBruteForceRule
from app.detection.rules.port_scan import PortScanRule
from app.detection.rules.suspicious_login import SuspiciousLoginRule
from app.detection.rules.auth_failure_burst import AuthFailureBurstRule

logger = logging.getLogger(__name__)

# Register all active rules here — add new rules to this list
RULES: List[BaseDetectionRule] = [
    SSHBruteForceRule(),
    PortScanRule(),
    SuspiciousLoginRule(),
    AuthFailureBurstRule(),
]

# How long to wait before re-creating an incident for the same rule + source
COOLDOWN_SECONDS = 300  # 5 minutes


class DetectionEngine:
    """Runs all registered rules against an incoming event."""

    def __init__(self, rules: Optional[List[BaseDetectionRule]] = None):
        self.rules = rules or RULES

    def _severity_to_enum(self, severity: str) -> IncidentSeverity:
        mapping = {
            "low": IncidentSeverity.LOW,
            "medium": IncidentSeverity.MEDIUM,
            "high": IncidentSeverity.HIGH,
            "critical": IncidentSeverity.CRITICAL,
        }
        return mapping.get(severity.lower(), IncidentSeverity.MEDIUM)

    def _is_duplicate_incident(
        self, db: Session, rule_name: str, source_ip: str
    ) -> bool:
        """Return True if we recently created an incident for this rule + source."""
        cooldown_start = datetime.utcnow() - timedelta(seconds=COOLDOWN_SECONDS)
        existing = (
            db.query(Incident)
            .filter(
                Incident.detection_rule == rule_name,
                Incident.source_ip == source_ip,
                Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING]),
                Incident.created_at >= cooldown_start,
            )
            .first()
        )
        return existing is not None

    def process_event(self, event: SecurityEvent, db: Session) -> List[Incident]:
        """
        Run all rules against the event.
        Creates incidents for triggered rules and returns them.
        """
        created_incidents: List[Incident] = []

        for rule in self.rules:
            if not rule.enabled:
                continue
            try:
                result = rule.evaluate(event, db)
                if result and result.triggered:
                    incident = self._handle_result(result, event, db)
                    if incident:
                        created_incidents.append(incident)
            except Exception as e:
                logger.error(f"Rule {rule.name} raised exception: {e}", exc_info=True)

        # Mark the event as processed
        event.processed = True
        db.commit()

        return created_incidents

    def _handle_result(
        self,
        result: DetectionResult,
        event: SecurityEvent,
        db: Session,
    ) -> Optional[Incident]:
        """Create an incident from a detection result (if not a duplicate)."""
        if result.source_ip and self._is_duplicate_incident(
            db, result.rule_name, result.source_ip
        ):
            logger.debug(
                f"Suppressing duplicate incident for rule={result.rule_name} "
                f"src={result.source_ip}"
            )
            # Still mark related events as processed
            if result.related_event_ids:
                db.query(SecurityEvent).filter(
                    SecurityEvent.id.in_(result.related_event_ids)
                ).update({"processed": True}, synchronize_session=False)
            return None

        logger.info(
            f"🚨 Detection rule '{result.rule_name}' triggered! "
            f"severity={result.severity} risk={result.risk_score:.0f}"
        )

        incident = Incident(
            title=result.title,
            description=result.description,
            severity=self._severity_to_enum(result.severity),
            risk_score=result.risk_score,
            status=IncidentStatus.OPEN,
            source_ip=result.source_ip,
            target_asset=result.target_asset,
            detection_rule=result.rule_name,
            evidence=result.evidence or {},
            created_at=datetime.utcnow(),
        )
        db.add(incident)
        db.flush()  # get incident.id

        # Link related events to this incident
        if result.related_event_ids:
            db.query(SecurityEvent).filter(
                SecurityEvent.id.in_(result.related_event_ids)
            ).update(
                {"processed": True, "incident_id": incident.id},
                synchronize_session=False,
            )

        db.commit()
        db.refresh(incident)
        return incident


# Global engine instance
detection_engine = DetectionEngine()
