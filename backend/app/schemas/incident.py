from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime
from app.models.incident import IncidentSeverity, IncidentStatus


class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: IncidentSeverity
    risk_score: float = 0.0
    source_ip: Optional[str] = None
    target_asset: Optional[str] = None
    detection_rule: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[IncidentStatus] = None
    assigned_to: Optional[int] = None
    risk_score: Optional[float] = None


class IncidentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    severity: IncidentSeverity
    risk_score: float
    status: IncidentStatus
    source_ip: Optional[str]
    target_asset: Optional[str]
    detection_rule: Optional[str]
    evidence: Optional[Dict[str, Any]]
    assigned_to: Optional[int]
    ai_analysis: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]
    resolved_at: Optional[datetime]

    model_config = {"from_attributes": True}


class IncidentListResponse(BaseModel):
    items: List[IncidentResponse]
    total: int
    page: int
    size: int
