"""
AI Security Analyst Service.
Uses OpenAI-compatible APIs to analyze incidents and generate actionable intelligence.
Falls back to a rule-based mock analysis when no API key is set.
"""
import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.models.incident import Incident

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are SentinelX AI, an expert cybersecurity analyst embedded in a Security Operations Center (SOC).
Your role is to analyze security incidents and provide clear, actionable intelligence to security analysts.

When analyzing an incident, respond ONLY with a valid JSON object following this exact schema:
{
  "summary": "Brief 2-3 sentence incident summary",
  "likely_attack": "Name of the likely attack technique or threat",
  "severity_justification": "Why this severity level was assigned",
  "suspicious_indicators": ["indicator1", "indicator2"],
  "potential_impact": "What could happen if this is not addressed",
  "investigation_steps": ["step1", "step2", "step3"],
  "remediation": ["action1", "action2", "action3"],
  "mitre_techniques": ["T1110.001", "T1078"],
  "confidence": "high|medium|low",
  "analyst_note": "Any additional context or caveats"
}

Be specific, concise, and professional. Use real MITRE ATT&CK technique IDs when applicable."""


def _mock_analysis(incident: Incident) -> Dict[str, Any]:
    """
    Rule-based mock analysis used when no OpenAI API key is configured.
    Provides realistic-looking but template-based output.
    """
    rule = incident.detection_rule or "unknown"
    evidence = incident.evidence or {}

    templates = {
        "ssh_brute_force": {
            "summary": (
                f"Multiple failed SSH authentication attempts were detected from {incident.source_ip}. "
                f"A total of {evidence.get('failure_count', 'several')} failures were observed within a short window, "
                "indicating an automated brute-force attack."
            ),
            "likely_attack": "SSH Brute Force / Credential Stuffing",
            "severity_justification": f"High severity because {evidence.get('failure_count', 'multiple')} rapid authentication failures indicate automated attack tooling.",
            "suspicious_indicators": [
                f"Source IP {incident.source_ip} generated {evidence.get('failure_count', 'N')} failures",
                f"Usernames attempted: {', '.join(evidence.get('usernames_attempted', ['admin', 'root']))}",
                "Failures occurred in rapid succession",
            ],
            "potential_impact": "Unauthorized SSH access, lateral movement, data exfiltration, or ransomware deployment.",
            "investigation_steps": [
                f"Check threat intelligence on {incident.source_ip} (AbuseIPDB, VirusTotal)",
                "Review /var/log/auth.log on the target for any successful logins",
                "Verify current active SSH sessions on affected hosts",
                "Check for any new user accounts or authorized_keys modifications",
                "Determine if the attacker has tried other services from this IP",
            ],
            "remediation": [
                f"Block source IP {incident.source_ip} at the firewall/perimeter",
                "Enforce SSH key-based authentication and disable password auth",
                "Implement fail2ban or similar rate-limiting on SSH",
                "Change passwords for all accounts targeted in the attack",
                "Consider moving SSH to a non-standard port",
            ],
            "mitre_techniques": ["T1110.001", "T1078.001"],
            "confidence": "high",
            "analyst_note": "This is AI-assisted analysis. Configure OPENAI_API_KEY for GPT-powered analysis.",
        },
        "port_scan": {
            "summary": (
                f"Port scanning activity was detected originating from {incident.source_ip}. "
                f"The scanner probed {len(evidence.get('ports_scanned', []))} port(s), suggesting network reconnaissance."
            ),
            "likely_attack": "Network Reconnaissance / Port Scanning",
            "severity_justification": "Medium severity as this represents reconnaissance that often precedes targeted attacks.",
            "suspicious_indicators": [
                f"Source IP {incident.source_ip} scanned multiple ports",
                f"Ports targeted: {', '.join(str(p) for p in evidence.get('ports_scanned', [])[:10])}",
                "Scan pattern consistent with automated tooling (nmap, masscan)",
            ],
            "potential_impact": "Attacker may identify open services as targets for exploitation. Precursor to more targeted attacks.",
            "investigation_steps": [
                f"Threat-intel lookup on {incident.source_ip}",
                "Review firewall logs for subsequent connection attempts from this IP",
                "Identify any vulnerable services running on the scanned ports",
                "Check if the scan targeted production vs. internal hosts",
            ],
            "remediation": [
                f"Block {incident.source_ip} at the perimeter firewall",
                "Review and minimize exposed services/ports",
                "Implement network segmentation to limit lateral movement",
                "Consider deploying a honeypot to detect future reconnaissance",
            ],
            "mitre_techniques": ["T1046", "T1590.005"],
            "confidence": "high",
            "analyst_note": "This is AI-assisted analysis. Configure OPENAI_API_KEY for GPT-powered analysis.",
        },
        "suspicious_login": {
            "summary": (
                f"A suspicious authentication event was flagged from {incident.source_ip}. "
                "This may indicate a successful brute-force, credential compromise, or account takeover."
            ),
            "likely_attack": "Account Takeover / Credential Compromise",
            "severity_justification": "High severity because suspicious logins may indicate successful unauthorized access.",
            "suspicious_indicators": [
                f"Unusual login from {incident.source_ip}",
                "Login pattern deviates from normal baseline",
                "Potentially preceded by failed authentication attempts",
            ],
            "potential_impact": "Unauthorized access to internal systems, data breach, or use of compromised account for lateral movement.",
            "investigation_steps": [
                "Verify whether the login was legitimate with the account owner",
                "Check for any data access, downloads, or privilege escalation after the login",
                "Review all recent activity from this account",
                f"Investigate source IP {incident.source_ip} for threat intelligence hits",
            ],
            "remediation": [
                "Immediately lock the affected account pending investigation",
                "Force password reset for the affected user",
                "Enable MFA on the affected account and all privileged accounts",
                "Review and revoke any suspicious sessions or API tokens",
            ],
            "mitre_techniques": ["T1078", "T1110.003"],
            "confidence": "medium",
            "analyst_note": "This is AI-assisted analysis. Configure OPENAI_API_KEY for GPT-powered analysis.",
        },
    }

    # Find best matching template
    for key in templates:
        if key in rule.lower():
            return templates[key]

    # Generic fallback
    return {
        "summary": f"A security incident was detected: {incident.title}. Severity: {incident.severity.value}.",
        "likely_attack": "Unknown — requires manual investigation",
        "severity_justification": f"Assigned {incident.severity.value} severity based on detection rule '{rule}'.",
        "suspicious_indicators": [f"Source IP: {incident.source_ip}", f"Rule triggered: {rule}"],
        "potential_impact": "Potential unauthorized access or system compromise.",
        "investigation_steps": [
            "Review all events associated with this incident",
            f"Investigate source IP {incident.source_ip}",
            "Check affected system logs",
            "Correlate with other recent incidents",
        ],
        "remediation": [
            "Isolate affected systems if compromise is confirmed",
            "Block malicious source IPs at the firewall",
            "Collect forensic evidence before remediation",
            "Follow your incident response playbook",
        ],
        "mitre_techniques": [],
        "confidence": "low",
        "analyst_note": "Generic analysis. Configure OPENAI_API_KEY for GPT-powered analysis.",
    }


async def analyze_incident(incident: Incident) -> Dict[str, Any]:
    """
    Analyze an incident using AI.
    Uses OpenAI if key is configured, falls back to mock analysis.
    """
    if not settings.OPENAI_API_KEY:
        logger.info("No OPENAI_API_KEY configured — using mock AI analysis")
        return _mock_analysis(incident)

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
        )

        incident_context = f"""
Incident ID: {incident.id}
Title: {incident.title}
Severity: {incident.severity.value}
Risk Score: {incident.risk_score}
Status: {incident.status.value}
Source IP: {incident.source_ip}
Target Asset: {incident.target_asset}
Detection Rule: {incident.detection_rule}
Description: {incident.description}
Evidence: {incident.evidence}
Created At: {incident.created_at.isoformat() if incident.created_at else 'N/A'}
"""

        response = await client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this security incident:\n{incident_context}"},
            ],
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )

        import json
        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        logger.error(f"AI analysis failed: {e}", exc_info=True)
        logger.info("Falling back to mock analysis")
        return _mock_analysis(incident)
