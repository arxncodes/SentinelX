import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class IncidentSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(SAEnum(IncidentSeverity, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    risk_score = Column(Float, default=0.0, nullable=False)
    status = Column(SAEnum(IncidentStatus, values_callable=lambda x: [e.value for e in x]), default=IncidentStatus.OPEN, nullable=False, index=True)

    # Source info
    source_ip = Column(String(45), nullable=True, index=True)
    target_asset = Column(String(255), nullable=True)

    # Detection
    detection_rule = Column(String(128), nullable=True)
    evidence = Column(JSON, nullable=True)  # List of event IDs, raw data, etc.

    # Assignment
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_analyst = relationship("User", back_populates="assigned_incidents", foreign_keys=[assigned_to])

    # AI analysis (cached)
    ai_analysis = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Incident id={self.id} title={self.title} severity={self.severity} status={self.status}>"
