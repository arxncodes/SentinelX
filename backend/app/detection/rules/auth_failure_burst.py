"""
Auth Failure Burst Detection Rule.
Triggers when any service sees a rapid burst of authentication failures
(broader than SSH brute force — catches all services).
"""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.event import SecurityEvent, EventType
from app.detection.rules.base import BaseDetectionRule, DetectionResult


class AuthFailureBurstRule(BaseDetectionRule):
    name = "auth_failure_burst"
    description = "Detects a burst of authentication failures across any service"
    enabled = True

    THRESHOLD = 10             # failures from same IP across any service
    WINDOW_SECONDS = 60        # within 60 seconds

    def evaluate(self, event: SecurityEvent, db: Session) -> Optional[DetectionResult]:
        if event.event_type != EventType.AUTHENTICATION_FAILURE:
            return None

        window_start = datetime.utcnow() - timedelta(seconds=self.WINDOW_SECONDS)

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

        unprocessed = [e for e in failures if not e.processed]
        if not unprocessed:
            return None

        services = list({e.service for e in failures if e.service})
        risk_score = min(55 + len(failures) * 2, 95)

        return DetectionResult(
            triggered=True,
            rule_name=self.name,
            title=f"Authentication Failure Burst from {event.source_ip}",
            description=(
                f"{len(failures)} authentication failures from {event.source_ip} "
                f"in {self.WINDOW_SECONDS} seconds across {len(services)} service(s)."
            ),
            severity="medium",
            risk_score=risk_score,
            source_ip=event.source_ip,
            target_asset=event.hostname,
            evidence={
                "failure_count": len(failures),
                "services_targeted": services,
                "window_seconds": self.WINDOW_SECONDS,
                "usernames_attempted": list({e.username for e in failures if e.username}),
            },
            related_event_ids=[e.id for e in failures],
        )
