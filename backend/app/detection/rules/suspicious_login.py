"""
Suspicious Login Detection Rule.
Triggers on explicit suspicious_login events, or on authentication_success
events that follow many recent authentication failures (possible successful brute-force).
"""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.event import SecurityEvent, EventType
from app.detection.rules.base import BaseDetectionRule, DetectionResult


class SuspiciousLoginRule(BaseDetectionRule):
    name = "suspicious_login"
    description = "Detects suspicious logins including post-brute-force successful authentication"
    enabled = True

    PRIOR_FAILURES_THRESHOLD = 3   # prior failures that make a success suspicious
    WINDOW_SECONDS = 300            # 5-minute look-back

    def evaluate(self, event: SecurityEvent, db: Session) -> Optional[DetectionResult]:
        # Direct suspicious_login event
        if event.event_type == EventType.SUSPICIOUS_LOGIN:
            return DetectionResult(
                triggered=True,
                rule_name=self.name,
                title=f"Suspicious Login from {event.source_ip}",
                description=(
                    f"A suspicious login event was recorded from {event.source_ip}"
                    + (f" for user '{event.username}'" if event.username else "") + "."
                ),
                severity="high",
                risk_score=75.0,
                source_ip=event.source_ip,
                target_asset=event.hostname,
                evidence={
                    "username": event.username,
                    "service": event.service,
                    "message": event.message,
                },
                related_event_ids=[event.id],
            )

        # auth_success after many failures = possible successful brute-force
        if event.event_type == EventType.AUTHENTICATION_SUCCESS:
            window_start = datetime.utcnow() - timedelta(seconds=self.WINDOW_SECONDS)
            prior_failures = (
                db.query(SecurityEvent)
                .filter(
                    SecurityEvent.source_ip == event.source_ip,
                    SecurityEvent.event_type == EventType.AUTHENTICATION_FAILURE,
                    SecurityEvent.timestamp >= window_start,
                    SecurityEvent.timestamp < event.timestamp,
                )
                .count()
            )

            if prior_failures >= self.PRIOR_FAILURES_THRESHOLD:
                risk_score = min(60 + prior_failures * 3, 95)
                return DetectionResult(
                    triggered=True,
                    rule_name=self.name,
                    title=f"Successful Login After {prior_failures} Failures — {event.source_ip}",
                    description=(
                        f"Authentication succeeded from {event.source_ip} after "
                        f"{prior_failures} failed attempts in the last "
                        f"{self.WINDOW_SECONDS // 60} minutes. Possible brute-force success."
                    ),
                    severity="critical",
                    risk_score=risk_score,
                    source_ip=event.source_ip,
                    target_asset=event.hostname,
                    evidence={
                        "username": event.username,
                        "prior_failures": prior_failures,
                        "service": event.service,
                    },
                    related_event_ids=[event.id],
                )

        return None
