from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.event import SecurityEvent, EventSeverity
from app.models.incident import Incident, IncidentStatus, IncidentSeverity
from app.models.asset import Asset
from app.models.user import User
from app.core.dependencies import get_current_active_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return high-level SOC statistics for the dashboard overview cards."""
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)

    total_events = db.query(SecurityEvent).count()
    events_24h = db.query(SecurityEvent).filter(SecurityEvent.timestamp >= last_24h).count()
    total_incidents = db.query(Incident).count()
    open_incidents = db.query(Incident).filter(Incident.status == IncidentStatus.OPEN).count()
    investigating = db.query(Incident).filter(Incident.status == IncidentStatus.INVESTIGATING).count()
    critical_incidents = db.query(Incident).filter(
        Incident.severity == IncidentSeverity.CRITICAL,
        Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING]),
    ).count()
    high_incidents = db.query(Incident).filter(
        Incident.severity == IncidentSeverity.HIGH,
        Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING]),
    ).count()
    total_assets = db.query(Asset).count()

    # Overall risk score = weighted average of open incident risk scores
    risk_result = db.query(func.avg(Incident.risk_score)).filter(
        Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING])
    ).scalar()
    overall_risk = round(float(risk_result or 0), 1)

    # Severity breakdown for all events in last 7 days
    severity_counts = (
        db.query(SecurityEvent.severity, func.count(SecurityEvent.id))
        .filter(SecurityEvent.timestamp >= last_7d)
        .group_by(SecurityEvent.severity)
        .all()
    )
    severity_dist = {s.value: c for s, c in severity_counts}

    return {
        "total_events": total_events,
        "events_24h": events_24h,
        "total_incidents": total_incidents,
        "open_incidents": open_incidents,
        "investigating_incidents": investigating,
        "critical_incidents": critical_incidents,
        "high_incidents": high_incidents,
        "total_assets": total_assets,
        "overall_risk_score": overall_risk,
        "severity_distribution": severity_dist,
    }


@router.get("/activity")
def get_activity(
    hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return event activity grouped by hour for the activity chart."""
    since = datetime.utcnow() - timedelta(hours=hours)

    rows = (
        db.query(
            func.date_trunc("hour", SecurityEvent.timestamp).label("hour"),
            func.count(SecurityEvent.id).label("count"),
        )
        .filter(SecurityEvent.timestamp >= since)
        .group_by("hour")
        .order_by("hour")
        .all()
    )

    return [{"hour": r.hour.isoformat(), "count": r.count} for r in rows]


@router.get("/top-source-ips")
def get_top_source_ips(
    limit: int = 10,
    hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return the most active source IPs by event count."""
    since = datetime.utcnow() - timedelta(hours=hours)
    rows = (
        db.query(
            SecurityEvent.source_ip,
            func.count(SecurityEvent.id).label("count"),
        )
        .filter(SecurityEvent.timestamp >= since)
        .group_by(SecurityEvent.source_ip)
        .order_by(func.count(SecurityEvent.id).desc())
        .limit(limit)
        .all()
    )
    return [{"ip": r.source_ip, "count": r.count} for r in rows]


@router.get("/recent-incidents")
def get_recent_incidents(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return the most recently created incidents."""
    incidents = (
        db.query(Incident)
        .order_by(Incident.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": i.id,
            "title": i.title,
            "severity": i.severity.value,
            "status": i.status.value,
            "risk_score": i.risk_score,
            "source_ip": i.source_ip,
            "created_at": i.created_at.isoformat(),
        }
        for i in incidents
    ]
