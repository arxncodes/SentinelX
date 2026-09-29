import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.event import SecurityEvent, EventType, EventSeverity
from app.models.user import User
from app.schemas.event import SecurityEventCreate, SecurityEventResponse, EventListResponse
from app.core.dependencies import get_current_active_user
from app.detection.engine import detection_engine
from app.core.websocket_manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/events", tags=["Security Events"])


def _auto_severity(event_type: EventType) -> EventSeverity:
    """Assign a default severity based on event type if not specified."""
    mapping = {
        EventType.AUTHENTICATION_FAILURE: EventSeverity.MEDIUM,
        EventType.AUTHENTICATION_SUCCESS: EventSeverity.INFO,
        EventType.PORT_SCAN: EventSeverity.MEDIUM,
        EventType.SUSPICIOUS_LOGIN: EventSeverity.HIGH,
        EventType.PRIVILEGE_ESCALATION: EventSeverity.CRITICAL,
        EventType.MALWARE_DETECTION: EventSeverity.CRITICAL,
        EventType.FIREWALL_EVENT: EventSeverity.LOW,
        EventType.NETWORK_ANOMALY: EventSeverity.MEDIUM,
        EventType.FILE_ACCESS: EventSeverity.LOW,
        EventType.PROCESS_EXECUTION: EventSeverity.LOW,
    }
    return mapping.get(event_type, EventSeverity.INFO)


async def _run_detection_and_broadcast(event_id: int, db: Session):
    """Run detection engine and broadcast via WebSocket (background task)."""
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        return

    # Broadcast event to WebSocket clients
    await ws_manager.broadcast_event({
        "id": event.id,
        "source_ip": event.source_ip,
        "event_type": event.event_type.value,
        "severity": event.severity.value,
        "username": event.username,
        "service": event.service,
        "message": event.message,
        "timestamp": event.timestamp.isoformat(),
    })

    # Run detection rules
    incidents = detection_engine.process_event(event, db)

    # Broadcast any new incidents
    for incident in incidents:
        await ws_manager.broadcast_incident({
            "id": incident.id,
            "title": incident.title,
            "severity": incident.severity.value,
            "risk_score": incident.risk_score,
            "source_ip": incident.source_ip,
            "detection_rule": incident.detection_rule,
            "status": incident.status.value,
            "created_at": incident.created_at.isoformat(),
        })


@router.post("", response_model=SecurityEventResponse, status_code=201)
async def ingest_event(
    event_in: SecurityEventCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Ingest a security event. Runs detection engine asynchronously.
    No auth required to allow external log sources and the simulator to push events.
    """
    severity = event_in.severity or _auto_severity(event_in.event_type)

    event = SecurityEvent(
        source_ip=event_in.source_ip,
        destination_ip=event_in.destination_ip,
        event_type=event_in.event_type,
        severity=severity,
        username=event_in.username,
        service=event_in.service,
        port=event_in.port,
        hostname=event_in.hostname,
        message=event_in.message,
        raw_data=event_in.raw_data,
        timestamp=event_in.timestamp or datetime.utcnow(),
        processed=False,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Run detection + broadcast in background so we return immediately
    background_tasks.add_task(_run_detection_and_broadcast, event.id, db)

    logger.info(f"Event ingested: id={event.id} type={event.event_type.value} src={event.source_ip}")
    return event


@router.get("", response_model=EventListResponse)
def list_events(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    source_ip: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List security events with filtering and pagination."""
    query = db.query(SecurityEvent)

    if event_type:
        query = query.filter(SecurityEvent.event_type == event_type)
    if severity:
        query = query.filter(SecurityEvent.severity == severity)
    if source_ip:
        query = query.filter(SecurityEvent.source_ip == source_ip)

    total = query.count()
    items = (
        query.order_by(SecurityEvent.timestamp.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return EventListResponse(items=items, total=total, page=page, size=size)


@router.get("/{event_id}", response_model=SecurityEventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a single security event by ID."""
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Event not found")
    return event
