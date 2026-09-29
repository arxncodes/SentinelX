import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, Float, JSON, Text
from app.database import Base


class AssetStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    COMPROMISED = "compromised"
    UNKNOWN = "unknown"


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String(255), nullable=False, index=True)
    ip_address = Column(String(45), nullable=False, unique=True, index=True)
    operating_system = Column(String(128), nullable=True)
    services = Column(JSON, nullable=True)  # List of service names/ports
    status = Column(SAEnum(AssetStatus, values_callable=lambda x: [e.value for e in x]), default=AssetStatus.ONLINE, nullable=False)
    risk_score = Column(Float, default=0.0, nullable=False)
    description = Column(Text, nullable=True)
    owner = Column(String(128), nullable=True)
    location = Column(String(128), nullable=True)
    tags = Column(JSON, nullable=True)  # List of tag strings
    last_seen = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Asset id={self.id} hostname={self.hostname} ip={self.ip_address}>"
