from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.asset import Asset
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.core.dependencies import get_current_active_user
from app.services.audit import log_asset_change

router = APIRouter(prefix="/api/assets", tags=["Assets"])


@router.get("", response_model=list[AssetResponse])
def list_assets(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Asset)
    if status:
        query = query.filter(Asset.status == status)
    return query.order_by(Asset.risk_score.desc()).all()


@router.post("", response_model=AssetResponse, status_code=201)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    existing = db.query(Asset).filter(Asset.ip_address == asset_in.ip_address).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset with this IP already exists")

    asset = Asset(**asset_in.model_dump(), created_at=datetime.utcnow(), last_seen=datetime.utcnow())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    log_asset_change(db, current_user, asset.id, "created", {"hostname": asset.hostname})
    return asset


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.patch("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    updates: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(asset, field, value)
    asset.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(asset)
    log_asset_change(db, current_user, asset.id, "updated")
    return asset


@router.delete("/{asset_id}", status_code=204)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
