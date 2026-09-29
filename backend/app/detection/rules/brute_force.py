"""
SSH Brute Force Detection Rule.
Triggers when >= N authentication failures come from the same source IP
against the same service within a sliding time window.
"""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.event import SecurityEvent, EventType
from app.detection.rules.base import BaseDetectionRule, DetectionResult


class SSHBruteForceRule(BaseDetectionRule):
    name = "ssh_brute_force"
    description = "Detects rapid SSH authentication failures from a single source IP"
    enabled = True

    THRESHOLD = 5              # failures required to trigger
    WINDOW_SECONDS = 180       # 3-minute sliding window
    SERVICE = "ssh"

    def evaluate(self, event: SecurityEvent, db: Session) -> Optional[DetectionResult]:
        # Only care about SSH auth failures
        if event.event_type != EventType.AUTHENTICATION_FAILURE:
            return None
        if event.service and event.service.lower() != self.SERVICE:
            return None

        window_start = datetime.utcnow() - timedelta(seconds=self.WINDOW_SECONDS)

        # Count recent SSH failures from this source IP
        failures = (
            db.query(SecurityEvent)
            .filter(
                SecurityEvent.source_ip == event.source_ip,
                SecurityEvent.event_type == EventType.AUTHENTICATION_FAILURE,
                SecurityEvent.timestamp >= window_start,
            )
            .all()
        )

        if len(failures) < self.THRESHOLD:
            return None

        # Check we haven't already created an incident for this IP recently
        # (avoid duplicate incidents — check via processed flag on oldest unprocessed)
        unprocessed = [e for e in failures if not e.processed]
        if not unprocessed:
            return None

        # Scale risk score with number of attempts
        risk_score = min(50 + (len(failures) - self.THRESHOLD) * 5, 99)
        event_ids = [e.id for e in failures]

        return DetectionResult(
            triggered=True,
            rule_name=self.name,
            title=f"SSH Brute Force Attack from {event.source_ip}",
            description=(
                f"{len(failures)} failed SSH authentication attempts detected from "
                f"{event.source_ip} within {self.WINDOW_SECONDS // 60} minutes."
            ),
            severity="high",
            risk_score=risk_score,
            source_ip=event.source_ip,
            target_asset=event.hostname or event.destination_ip,
            evidence={
                "failure_count": len(failures),
                "window_seconds": self.WINDOW_SECONDS,
                "service": self.SERVICE,
                "usernames_attempted": list({e.username for e in failures if e.username}),
                "first_seen": failures[0].timestamp.isoformat() if failures else None,
                "last_seen": failures[-1].timestamp.isoformat() if failures else None,
            },
            related_event_ids=event_ids,
        )
