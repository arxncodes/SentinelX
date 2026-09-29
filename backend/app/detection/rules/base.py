"""
Abstract base class for all detection rules.
Each rule receives a newly ingested event and the DB session,
and may return an Incident to be created.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, List, Any, Dict
from sqlalchemy.orm import Session
from app.models.event import SecurityEvent


@dataclass
class DetectionResult:
    """Returned by a rule when it fires."""
    triggered: bool
    rule_name: str
    title: str
    description: str
    severity: str  # low | medium | high | critical
    risk_score: float
    source_ip: Optional[str] = None
    target_asset: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None
    related_event_ids: List[int] = field(default_factory=list)


class BaseDetectionRule(ABC):
    """Base class all detection rules must inherit."""

    name: str = "base_rule"
    description: str = ""
    enabled: bool = True

    @abstractmethod
    def evaluate(self, event: SecurityEvent, db: Session) -> Optional[DetectionResult]:
        """
        Evaluate the event against this rule.
        Return DetectionResult if the rule triggers, else None.
        """
        ...
