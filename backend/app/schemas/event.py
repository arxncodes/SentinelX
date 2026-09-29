from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime
from app.models.event import EventType, EventSeverity


class SecurityEventCreate(BaseModel):
    source_ip: str
    destination_ip: Optional[str] = None
    event_type: EventType
    severity: Optional[EventSeverity] = EventSeverity.INFO
    username: Optional[str] = None
    service: Optional[str] = None
    port: Optional[int] = None
    hostname: Optional[str] = None
    message: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None


class SecurityEventResponse(BaseModel):
    id: int
    source_ip: str
    destination_ip: Optional[str]
    event_type: EventType
    severity: EventSeverity
    username: Optional[str]
    service: Optional[str]
    port: Optional[int]
    hostname: Optional[str]
    message: Optional[str]
    raw_data: Optional[Dict[str, Any]]
    processed: bool
    incident_id: Optional[int]
    timestamp: datetime
    ingested_at: datetime

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    items: List[SecurityEventResponse]
    total: int
    page: int
    size: int
