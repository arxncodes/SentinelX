from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from app.models.asset import AssetStatus


class AssetCreate(BaseModel):
    hostname: str
    ip_address: str
    operating_system: Optional[str] = None
    services: Optional[List[str]] = None
    status: Optional[AssetStatus] = AssetStatus.ONLINE
    description: Optional[str] = None
    owner: Optional[str] = None
    location: Optional[str] = None
    tags: Optional[List[str]] = None


class AssetUpdate(BaseModel):
    hostname: Optional[str] = None
    operating_system: Optional[str] = None
    services: Optional[List[str]] = None
    status: Optional[AssetStatus] = None
    risk_score: Optional[float] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    location: Optional[str] = None
    tags: Optional[List[str]] = None


class AssetResponse(BaseModel):
    id: int
    hostname: str
    ip_address: str
    operating_system: Optional[str]
    services: Optional[List[str]]
    status: AssetStatus
    risk_score: float
    description: Optional[str]
    owner: Optional[str]
    location: Optional[str]
    tags: Optional[List[str]]
    last_seen: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
