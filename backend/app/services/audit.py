"""
Audit logging service.
Records important analyst actions to the audit_logs table.
"""
import logging
from typing import Optional, Any, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User

logger = logging.getLogger(__name__)


def log_action(
    db: Session,
    action: str,
    user: Optional[User] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[Any] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """Create and persist an audit log entry."""
    entry = AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else "system",
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        timestamp=datetime.utcnow(),
    )
    db.add(entry)
    try:
        db.commit()
        db.refresh(entry)
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")
        db.rollback()
    return entry


# Common audit action helpers
def log_login(db: Session, user: User, ip_address: str) -> AuditLog:
    return log_action(db, "user.login", user=user, resource_type="user", resource_id=user.id, ip_address=ip_address)


def log_logout(db: Session, user: User) -> AuditLog:
    return log_action(db, "user.logout", user=user, resource_type="user", resource_id=user.id)


def log_incident_status_change(
    db: Session, user: User, incident_id: int, old_status: str, new_status: str
) -> AuditLog:
    return log_action(
        db,
        "incident.status_changed",
        user=user,
        resource_type="incident",
        resource_id=incident_id,
        details={"old_status": old_status, "new_status": new_status},
    )


def log_incident_assigned(
    db: Session, user: User, incident_id: int, assigned_to_id: int
) -> AuditLog:
    return log_action(
        db,
        "incident.assigned",
        user=user,
        resource_type="incident",
        resource_id=incident_id,
        details={"assigned_to_user_id": assigned_to_id},
    )


def log_asset_change(
    db: Session, user: User, asset_id: int, action: str, details: Dict = None
) -> AuditLog:
    return log_action(
        db,
        f"asset.{action}",
        user=user,
        resource_type="asset",
        resource_id=asset_id,
        details=details,
    )
