"""
Seed script — populates the database with demo data.
Runs on first startup via the Docker CMD.
Idempotent: skips if data already exists.
"""
import logging
from datetime import datetime, timedelta
import random
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.asset import Asset, AssetStatus
from app.models.detection_rule import DetectionRule, RuleType
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)


DEMO_ASSETS = [
    {"hostname": "web-prod-01", "ip_address": "10.0.1.10", "operating_system": "Ubuntu 22.04 LTS",
     "services": ["nginx", "certbot"], "owner": "Platform Team", "location": "us-east-1", "tags": ["web", "production"]},
    {"hostname": "db-primary-01", "ip_address": "10.0.2.10", "operating_system": "Ubuntu 22.04 LTS",
     "services": ["postgresql"], "owner": "Data Team", "location": "us-east-1", "tags": ["database", "production"]},
    {"hostname": "api-server-01", "ip_address": "10.0.1.20", "operating_system": "Debian 12",
     "services": ["gunicorn", "redis"], "owner": "Backend Team", "location": "us-east-1", "tags": ["api", "production"]},
    {"hostname": "jumpbox-01", "ip_address": "10.0.0.5", "operating_system": "CentOS 9",
     "services": ["ssh", "fail2ban"], "owner": "SecOps Team", "location": "us-east-1", "tags": ["bastion", "ssh"]},
    {"hostname": "monitoring-01", "ip_address": "10.0.3.10", "operating_system": "Ubuntu 22.04 LTS",
     "services": ["prometheus", "grafana", "alertmanager"], "owner": "DevOps Team", "location": "us-east-1", "tags": ["monitoring"]},
    {"hostname": "dev-workstation-07", "ip_address": "192.168.10.7", "operating_system": "macOS 14",
     "services": [], "owner": "Engineering", "location": "office-nyc", "tags": ["endpoint", "dev"]},
    {"hostname": "firewall-01", "ip_address": "10.0.0.1", "operating_system": "pfSense 2.7",
     "services": ["pf", "snort"], "owner": "Network Team", "location": "us-east-1", "tags": ["firewall", "network"]},
    {"hostname": "ci-runner-01", "ip_address": "10.0.4.10", "operating_system": "Ubuntu 22.04 LTS",
     "services": ["github-runner", "docker"], "owner": "DevOps Team", "location": "us-east-1", "tags": ["ci", "build"]},
]

DETECTION_RULES = [
    {
        "name": "ssh_brute_force",
        "description": "Detects rapid SSH authentication failures from a single source IP",
        "rule_type": RuleType.THRESHOLD,
        "severity": "high",
        "threshold": 5,
        "window_seconds": 180,
        "event_types": ["authentication_failure"],
        "risk_score_base": 75.0,
    },
    {
        "name": "port_scan",
        "description": "Detects port scanning activity from a single source IP",
        "rule_type": RuleType.THRESHOLD,
        "severity": "medium",
        "threshold": 3,
        "window_seconds": 120,
        "event_types": ["port_scan"],
        "risk_score_base": 55.0,
    },
    {
        "name": "suspicious_login",
        "description": "Detects suspicious logins including post-brute-force successful authentication",
        "rule_type": RuleType.PATTERN,
        "severity": "high",
        "threshold": 3,
        "window_seconds": 300,
        "event_types": ["suspicious_login", "authentication_success"],
        "risk_score_base": 70.0,
    },
    {
        "name": "auth_failure_burst",
        "description": "Detects a burst of authentication failures across any service",
        "rule_type": RuleType.THRESHOLD,
        "severity": "medium",
        "threshold": 10,
        "window_seconds": 60,
        "event_types": ["authentication_failure"],
        "risk_score_base": 60.0,
    },
    {
        "name": "privilege_escalation",
        "description": "Detects privilege escalation events",
        "rule_type": RuleType.PATTERN,
        "severity": "critical",
        "threshold": 1,
        "window_seconds": 60,
        "event_types": ["privilege_escalation"],
        "risk_score_base": 90.0,
    },
]


def seed():
    db = SessionLocal()
    try:
        # --- Admin user ---
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                username="admin",
                email="admin@sentinelx.local",
                full_name="SentinelX Admin",
                hashed_password=get_password_hash("admin1234"),
                role=UserRole.ADMIN,
                is_active=True,
                created_at=datetime.utcnow(),
            )
            db.add(admin)
            logger.info("✅ Created admin user (admin / admin1234)")

        # --- Analyst user ---
        if not db.query(User).filter(User.username == "analyst").first():
            analyst = User(
                username="analyst",
                email="analyst@sentinelx.local",
                full_name="SOC Analyst",
                hashed_password=get_password_hash("analyst1234"),
                role=UserRole.ANALYST,
                is_active=True,
                created_at=datetime.utcnow(),
            )
            db.add(analyst)
            logger.info("✅ Created analyst user (analyst / analyst1234)")

        # --- Assets ---
        for asset_data in DEMO_ASSETS:
            if not db.query(Asset).filter(Asset.ip_address == asset_data["ip_address"]).first():
                risk = random.uniform(5, 45)
                asset = Asset(
                    **asset_data,
                    risk_score=round(risk, 1),
                    last_seen=datetime.utcnow() - timedelta(minutes=random.randint(0, 60)),
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
                )
                db.add(asset)
        logger.info(f"✅ Seeded {len(DEMO_ASSETS)} assets")

        # --- Detection Rules ---
        for rule_data in DETECTION_RULES:
            if not db.query(DetectionRule).filter(DetectionRule.name == rule_data["name"]).first():
                rule = DetectionRule(**rule_data, enabled=True, created_at=datetime.utcnow())
                db.add(rule)
        logger.info(f"✅ Seeded {len(DETECTION_RULES)} detection rules")

        db.commit()
        logger.info("🎉 Database seeding complete!")

    except Exception as e:
        logger.error(f"Seed failed: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed()
