import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, Text, Float, Boolean, JSON, Index
from app.database import Base


class EventType(str, enum.Enum):
    AUTHENTICATION_FAILURE = "authentication_failure"
    AUTHENTICATION_SUCCESS = "authentication_success"
    PORT_SCAN = "port_scan"
    SUSPICIOUS_LOGIN = "suspicious_login"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    MALWARE_DETECTION = "malware_detection"
    FIREWALL_EVENT = "firewall_event"
    NETWORK_ANOMALY = "network_anomaly"
    FILE_ACCESS = "file_access"
    PROCESS_EXECUTION = "process_execution"


class EventSeverity(str, enum.Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    source_ip = Column(String(45), nullable=False, index=True)
    destination_ip = Column(String(45), nullable=True)
    event_type = Column(SAEnum(EventType, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    severity = Column(SAEnum(EventSeverity, values_callable=lambda x: [e.value for e in x]), default=EventSeverity.INFO, nullable=False, index=True)
    username = Column(String(128), nullable=True, index=True)
    service = Column(String(64), nullable=True)
    port = Column(Integer, nullable=True)
    hostname = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    raw_data = Column(JSON, nullable=True)
    processed = Column(Boolean, default=False, nullable=False)
    incident_id = Column(Integer, nullable=True)  # If linked to an incident
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    ingested_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_events_source_ip_timestamp", "source_ip", "timestamp"),
        Index("ix_events_type_timestamp", "event_type", "timestamp"),
    )

    def __repr__(self):
        return f"<SecurityEvent id={self.id} type={self.event_type} src={self.source_ip}>"
