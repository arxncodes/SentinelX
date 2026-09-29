.PHONY: up down build logs shell-backend shell-db migrate seed test simulate clean

# Start all services
up:
	docker compose up --build -d

# Start in foreground (see all logs)
up-fg:
	docker compose up --build

# Stop all services
down:
	docker compose down

# Stop and remove volumes
clean:
	docker compose down -v --remove-orphans

# Build images
build:
	docker compose build

# View logs
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

# Shell into backend container
shell-backend:
	docker compose exec backend bash

# Shell into database
shell-db:
	docker compose exec postgres psql -U sentinelx -d sentinelx

# Run database migrations
migrate:
	docker compose exec backend alembic upgrade head

# Seed initial data
seed:
	docker compose exec backend python -m app.seed

# Run tests
test:
	docker compose exec backend pytest tests/ -v

# Run event simulator (generates fake security events)
simulate:
	docker compose exec backend python simulator/event_simulator.py

# Run simulator with a specific scenario
simulate-brute-force:
	docker compose exec backend python simulator/event_simulator.py --scenario brute_force

simulate-port-scan:
	docker compose exec backend python simulator/event_simulator.py --scenario port_scan

# Format & lint (run locally)
lint:
	cd backend && ruff check app/ && mypy app/
	cd frontend && npm run lint

# Development (run backend + frontend locally without Docker)
dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev
