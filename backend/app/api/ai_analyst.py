from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident
from app.models.user import User
from app.core.dependencies import get_current_active_user
from app.services.ai_analyst import analyze_incident

router = APIRouter(prefix="/api/ai", tags=["AI Analyst"])


@router.post("/analyze/{incident_id}")
async def analyze(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Run AI analysis on an incident.
    Caches the result in the incident record.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Return cached analysis if available
    if incident.ai_analysis:
        return {"incident_id": incident_id, "cached": True, "analysis": incident.ai_analysis}

    analysis = await analyze_incident(incident)

    # Cache in DB
    incident.ai_analysis = analysis
    db.commit()

    return {"incident_id": incident_id, "cached": False, "analysis": analysis}


@router.delete("/analyze/{incident_id}/cache")
def clear_analysis_cache(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Clear the cached AI analysis to force a re-run."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident.ai_analysis = None
    db.commit()
    return {"message": "Cache cleared"}
