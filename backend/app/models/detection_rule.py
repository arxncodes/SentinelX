import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, Boolean, JSON, Text, Float
from app.database import Base


class RuleType(str, enum.Enum):
    THRESHOLD = "threshold"
    PATTERN = "pattern"
    ANOMALY = "anomaly"
    CORRELATION = "correlation"


class DetectionRule(Base):
    __tablename__ = "detection_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    rule_type = Column(SAEnum(RuleType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    severity = Column(String(32), nullable=False, default="medium")
    threshold = Column(Integer, nullable=True)        # e.g. 5 failures
    window_seconds = Column(Integer, nullable=True)   # e.g. 300 (5 min)
    event_types = Column(JSON, nullable=True)         # event types to watch
    conditions = Column(JSON, nullable=True)          # extra rule-specific config
    risk_score_base = Column(Float, default=50.0)
    enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<DetectionRule id={self.id} name={self.name} enabled={self.enabled}>"
