# 🛡️ SentinelX SOC — AI-Powered Security Operations Platform

<div align="center">

![SentinelX Banner](https://img.shields.io/badge/SentinelX-SOC%20Platform-00d4ff?style=for-the-badge&logo=shield&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)

**A production-quality mini Security Operations Center platform showcasing full-stack development, real-time systems, AI integration, detection engineering, and DevOps.**

</div>

---

## 🎯 Project Overview

SentinelX SOC demonstrates:

- **Detection Engineering** — Modular, rule-based threat detection with configurable rules
- **Real-time Monitoring** — WebSocket-powered live event and incident streaming
- **AI-Powered Analysis** — Incident analysis via OpenAI with rule-based fallback
- **Full REST API** — Production-grade FastAPI backend with JWT auth and RBAC
- **Modern SOC UI** — Dark-themed React dashboard with live feeds and charts
- **Security Best Practices** — JWT, bcrypt hashing, RBAC, audit logging, input validation
- **DevOps** — Full Docker Compose stack, migrations with Alembic, CI-ready

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  Dashboard · Events · Incidents · Assets · AI Analyst       │
│  IP Investigation · Audit Logs                               │
└──────────────────────┬──────────────────────────────────────┘
                       │  REST API + WebSockets
┌──────────────────────▼──────────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                             │
│  ┌──────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │   Auth   │  │  Detection     │  │   AI Analyst       │  │
│  │  JWT+RBAC│  │  Engine        │  │  (GPT / Mock)      │  │
│  └──────────┘  └────────────────┘  └────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               WebSocket Manager                      │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │  SQLAlchemy ORM
┌──────────────────────▼──────────────────────────────────────┐
│                  PostgreSQL 16                               │
│  Users · Events · Incidents · Assets · Rules · AuditLogs   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional) Python 3.11+ for local development

### 1. Clone and Configure

```bash
git clone https://github.com/yourname/sentinelx-soc.git
cd sentinelx-soc
cp .env.example .env
# Edit .env — set OPENAI_API_KEY for real AI, or leave blank for mock mode
```

### 2. Start All Services

```bash
# Start everything (DB + backend + frontend)
docker compose up --build -d

# Or with Makefile
make up
```

### 3. Initialize Database & Seed Data

```bash
# Run migrations
docker compose exec backend alembic upgrade head

# Seed demo data (users, assets, detection rules)
docker compose exec backend python seed.py
```

### 4. Access the Platform

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| **Dashboard** | http://localhost:3000 | admin / admin1234 |
| **API Docs** | http://localhost:8000/docs | — |
| **Backend API** | http://localhost:8000 | — |
| **PostgreSQL** | localhost:5432 | sentinelx / sentinelx_pass |

---

## 🔬 Running the Event Simulator

The simulator generates realistic attack scenarios to fill the platform with demo data:

```bash
# Run from inside the backend container
docker compose exec backend python simulator/event_simulator.py

# Specific attack scenario
docker compose exec backend python simulator/event_simulator.py --scenario brute_force
docker compose exec backend python simulator/event_simulator.py --scenario port_scan
docker compose exec backend python simulator/event_simulator.py --scenario malware

# Mixed simulation (100 events, default)
docker compose exec backend python simulator/event_simulator.py --count 50

# Or from your local Python environment
cd backend
pip install httpx rich
python simulator/event_simulator.py --api http://localhost:8000
```

### Available Scenarios
| Scenario | Description |
|----------|-------------|
| `brute_force` | SSH brute-force attack with 8-25 login failures |
| `port_scan` | Multi-port scan against a target |
| `suspicious_login` | Login from unusual geolocation |
| `auth_burst` | Authentication failures across multiple services |
| `malware` | Malware detection event |
| `normal` | Legitimate user activity |
| `mixed` | Weighted random mix of all scenarios |

---

## 📁 Project Structure

```
sentinelx/
├── backend/
│   ├── app/
│   │   ├── api/              # REST route handlers
│   │   │   ├── auth.py       # JWT auth endpoints
│   │   │   ├── events.py     # Event ingestion + listing
│   │   │   ├── incidents.py  # Incident CRUD
│   │   │   ├── assets.py     # Asset management
│   │   │   ├── dashboard.py  # Aggregated stats
│   │   │   ├── ai.py         # AI analysis endpoint
│   │   │   ├── audit.py      # Audit log endpoint
│   │   │   ├── ip.py         # IP investigation
│   │   │   └── websocket.py  # WebSocket endpoint
│   │   ├── core/
│   │   │   ├── auth.py       # JWT + RBAC dependencies
│   │   │   ├── config.py     # Pydantic settings
│   │   │   └── websocket_manager.py  # WS broadcast manager
│   │   ├── detection/
│   │   │   ├── engine.py     # Detection orchestrator
│   │   │   └── rules/        # Individual detection rules
│   │   │       ├── brute_force.py
│   │   │       ├── port_scan.py
│   │   │       ├── suspicious_login.py
│   │   │       └── auth_failure_burst.py
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/
│   │   │   ├── ai_analyst.py # OpenAI / mock AI analysis
│   │   │   └── audit.py      # Audit logging service
│   │   ├── database.py       # DB connection
│   │   ├── main.py           # FastAPI app factory
│   │   └── seed.py           # Demo data seeder
│   ├── simulator/
│   │   ├── event_simulator.py  # Attack event generator
│   │   └── scenarios.py        # Attack scenario definitions
│   ├── tests/
│   │   ├── test_detection.py   # Detection engine unit tests
│   │   ├── test_auth.py        # Auth API tests
│   │   └── test_events.py      # Event ingestion tests
│   ├── alembic/              # Database migrations
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios API clients
│   │   ├── components/       # React components
│   │   │   ├── Layout/       # Sidebar, TopBar, AppLayout
│   │   │   ├── Dashboard/    # Charts, LiveFeed, StatsCards
│   │   │   └── common/       # Badges, States
│   │   ├── pages/            # Route-level page components
│   │   ├── store/            # Zustand state (auth, WebSocket)
│   │   └── types/            # TypeScript type definitions
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
├── Makefile
└── README.md
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT (HS256) with configurable expiry |
| Password Hashing | bcrypt via `passlib` |
| Authorization | Role-based (admin / analyst / viewer) |
| Input Validation | Pydantic schemas on all endpoints |
| CORS | Configurable allowed origins |
| Audit Logging | Every significant action logged with timestamp, user, IP |
| Secrets | Environment variables via `.env` (never committed) |
| SQL Injection | Protected by SQLAlchemy ORM |

---

## 🔭 Detection Engine

The detection engine evaluates each incoming event against registered rules:

### Current Rules

| Rule | Trigger | Severity |
|------|---------|----------|
| `ssh_brute_force` | 5+ SSH auth failures from same IP in 3 minutes | High |
| `port_scan` | 3+ port scan events from same IP in 2 minutes | Medium |
| `suspicious_login` | Direct suspicious_login event OR success after failures | High/Critical |
| `auth_failure_burst` | 10+ auth failures across any service in 1 minute | High |

### Adding Custom Rules

```python
# backend/app/detection/rules/my_rule.py
from app.detection.base import BaseRule, RuleResult

class MyCustomRule(BaseRule):
    name = "my_rule"
    description = "Detects my pattern"

    def evaluate(self, event: SecurityEvent, db: Session) -> Optional[RuleResult]:
        # Your logic here
        if self._should_trigger(event, db):
            return RuleResult(
                triggered=True,
                rule_name=self.name,
                severity="high",
                risk_score=75.0,
                title="My Custom Alert",
                description="...",
                evidence={},
            )
        return None
```

Then register it in `engine.py`.

---

## 🤖 AI Analyst

The AI analyst module generates structured incident reports:

- **With OpenAI API key**: Uses `gpt-4o-mini` for real analysis
- **Without API key**: Falls back to rule-based mock analysis

Analysis includes:
- Attack classification
- Suspicious indicators
- Potential impact assessment
- Step-by-step investigation guide
- Remediation actions
- MITRE ATT&CK technique mapping
- Confidence score

---

## 🧪 Running Tests

```bash
# From the backend directory
cd backend
pip install pytest pytest-asyncio httpx
pytest tests/ -v

# With Docker
docker compose exec backend pytest tests/ -v
```

---

## 🛠️ Development Setup

### Backend (local)

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Start Postgres (Docker)
docker compose up db -d

# Run migrations
alembic upgrade head

# Seed data
python seed.py

# Start backend
uvicorn app.main:app --reload --port 8000
```

### Frontend (local)

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173 with API proxy to :8000
```

---

## 🐳 Docker Commands

```bash
# Start all services
make up

# Stop
make down

# View logs
make logs
make logs-backend

# Reset database
make reset-db

# Run migrations
make migrate

# Seed data
make seed

# Run tests
make test
```

---

## 🗺️ API Reference

Full interactive docs available at http://localhost:8000/docs

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate and get JWT |
| GET | `/api/auth/me` | Current user info |
| POST | `/api/events` | Ingest a security event |
| GET | `/api/events` | List events with filters |
| GET | `/api/incidents` | List incidents with filters |
| PATCH | `/api/incidents/{id}` | Update incident status/severity |
| GET | `/api/dashboard/stats` | Aggregated SOC statistics |
| POST | `/api/ai/analyze/{id}` | Run AI analysis on incident |
| GET | `/api/ip/{ip}` | Full IP threat investigation |
| GET | `/api/audit-logs` | Platform audit trail |
| WS | `/ws` | Real-time event stream |

---

## 📊 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **State** | Zustand, React Query |
| **Charts** | Recharts |
| **Backend** | Python 3.11, FastAPI, Pydantic v2 |
| **ORM** | SQLAlchemy 2.0 |
| **Database** | PostgreSQL 16 |
| **Migrations** | Alembic |
| **Auth** | JWT (python-jose), bcrypt (passlib) |
| **Real-time** | WebSockets (FastAPI native) |
| **AI** | OpenAI API (gpt-4o-mini), rule-based fallback |
| **Infrastructure** | Docker, Docker Compose |
| **Testing** | pytest, pytest-asyncio |
| **Web Server** | nginx (frontend), uvicorn (backend) |

---

## 📝 License

MIT — Build on it, learn from it, ship it.

---

<div align="center">
Built with 🛡️ for portfolio demonstrations by <strong>SentinelX</strong>
</div>
