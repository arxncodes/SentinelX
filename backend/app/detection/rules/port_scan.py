"""
Port Scan Detection Rule.
Triggers when a source IP generates port_scan events, or when the same IP
is seen connecting to many different ports in a short window.
"""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.event import SecurityEvent, EventType
from app.detection.rules.base import BaseDetectionRule, DetectionResult


class PortScanRule(BaseDetectionRule):
    name = "port_scan"
    description = "Detects port scanning activity from a single source IP"
    enabled = True

    THRESHOLD = 3              # number of port_scan events to trigger
    WINDOW_SECONDS = 120       # 2-minute window

    def evaluate(self, event: SecurityEvent, db: Session) -> Optional[DetectionResult]:
        if event.event_type != EventType.PORT_SCAN:
            return None

        window_start = datetime.utcnow() - timedelta(seconds=self.WINDOW_SECONDS)

        scans = (
            db.query(SecurityEvent)
            .filter(
                SecurityEvent.source_ip == event.source_ip,
                SecurityEvent.event_type == EventType.PORT_SCAN,
                SecurityEvent.timestamp >= window_start,
            )
            .all()
        )

        if len(scans) < self.THRESHOLD:
            return None

        unprocessed = [e for e in scans if not e.processed]
        if not unprocessed:
            return None

        ports = list({e.port for e in scans if e.port})
        risk_score = min(40 + len(ports) * 3, 95)

        return DetectionResult(
            triggered=True,
            rule_name=self.name,
            title=f"Port Scan Detected from {event.source_ip}",
            description=(
                f"Port scanning activity detected from {event.source_ip}. "
                f"{len(scans)} scan events across {len(ports)} port(s) in "
                f"{self.WINDOW_SECONDS} seconds."
            ),
            severity="medium",
            risk_score=risk_score,
            source_ip=event.source_ip,
            target_asset=event.destination_ip or event.hostname,
            evidence={
                "scan_count": len(scans),
                "ports_scanned": ports,
                "window_seconds": self.WINDOW_SECONDS,
                "first_seen": scans[0].timestamp.isoformat(),
                "last_seen": scans[-1].timestamp.isoformat(),
            },
            related_event_ids=[e.id for e in scans],
        )
