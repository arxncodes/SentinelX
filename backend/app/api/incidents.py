import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident, IncidentStatus
from app.models.user import User
from app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentResponse, IncidentListResponse
from app.core.dependencies import get_current_active_user
from app.core.websocket_manager import ws_manager
from app.services.audit import log_incident_status_change, log_incident_assigned

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("", response_model=IncidentListResponse)
def list_incidents(
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    source_ip: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    if source_ip:
        query = query.filter(Incident.source_ip == source_ip)

    total = query.count()
    items = (
        query.order_by(Incident.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return IncidentListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=IncidentResponse, status_code=201)
def create_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Manually create an incident."""
    incident = Incident(**incident_in.model_dump(), created_at=datetime.utcnow())
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: int,
    updates: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update incident fields (status, assignment, severity, etc.)."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_status = incident.status.value if incident.status else None

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(incident, field, value)

    # Track resolution time
    if updates.status == IncidentStatus.RESOLVED and not incident.resolved_at:
        incident.resolved_at = datetime.utcnow()
    incident.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(incident)

    # Audit logging
    if updates.status and updates.status.value != old_status:
        log_incident_status_change(db, current_user, incident_id, old_status, updates.status.value)
    if updates.assigned_to:
        log_incident_assigned(db, current_user, incident_id, updates.assigned_to)

    # Broadcast update via WebSocket
    await ws_manager.broadcast_incident_update({
        "id": incident.id,
        "title": incident.title,
        "status": incident.status.value,
        "severity": incident.severity.value,
        "assigned_to": incident.assigned_to,
        "updated_at": incident.updated_at.isoformat() if incident.updated_at else None,
    })

    return incident


@router.delete("/{incident_id}", status_code=204)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.delete(incident)
    db.commit()
