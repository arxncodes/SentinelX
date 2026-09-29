from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.event import SecurityEvent
from app.models.incident import Incident, IncidentStatus
from app.models.user import User
from app.core.dependencies import get_current_active_user

router = APIRouter(prefix="/api/ip", tags=["IP Investigation"])


@router.get("/{ip_address}")
def investigate_ip(
    ip_address: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Full investigation report for an IP address.
    Returns related events, incidents, timeline, and risk assessment.
    """
    # All events from this IP
    events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.source_ip == ip_address)
        .order_by(SecurityEvent.timestamp.desc())
        .limit(200)
        .all()
    )

    # All incidents linked to this IP
    incidents = (
        db.query(Incident)
        .filter(Incident.source_ip == ip_address)
        .order_by(Incident.created_at.desc())
        .all()
    )

    if not events and not incidents:
        return {
            "ip_address": ip_address,
            "found": False,
            "message": "No activity found for this IP address",
        }

    # Aggregated stats
    first_seen = min(e.timestamp for e in events) if events else None
    last_seen = max(e.timestamp for e in events) if events else None

    event_type_counts: dict = {}
    for e in events:
        key = e.event_type.value
        event_type_counts[key] = event_type_counts.get(key, 0) + 1

    severity_counts: dict = {}
    for e in events:
        key = e.severity.value
        severity_counts[key] = severity_counts.get(key, 0) + 1

    # Risk score: weighted by severity and incidents
    severity_weights = {"info": 1, "low": 2, "medium": 5, "high": 10, "critical": 20}
    raw_risk = sum(severity_weights.get(e.severity.value, 1) for e in events)
    raw_risk += len(incidents) * 15
    risk_score = min(raw_risk, 100)

    open_incidents = [i for i in incidents if i.status in [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING]]

    return {
        "ip_address": ip_address,
        "found": True,
        "summary": {
            "total_events": len(events),
            "total_incidents": len(incidents),
            "open_incidents": len(open_incidents),
            "first_seen": first_seen.isoformat() if first_seen else None,
            "last_seen": last_seen.isoformat() if last_seen else None,
            "risk_score": risk_score,
        },
        "event_type_breakdown": event_type_counts,
        "severity_breakdown": severity_counts,
        "incidents": [
            {
                "id": i.id,
                "title": i.title,
                "severity": i.severity.value,
                "status": i.status.value,
                "risk_score": i.risk_score,
                "detection_rule": i.detection_rule,
                "created_at": i.created_at.isoformat(),
            }
            for i in incidents
        ],
        "recent_events": [
            {
                "id": e.id,
                "event_type": e.event_type.value,
                "severity": e.severity.value,
                "username": e.username,
                "service": e.service,
                "message": e.message,
                "timestamp": e.timestamp.isoformat(),
            }
            for e in events[:50]
        ],
    }
