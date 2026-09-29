"""
SentinelX Security Event Simulator
====================================
Generates realistic fake security events and sends them to the SentinelX API.
Used to demonstrate the full detection pipeline for portfolio/demo purposes.

Usage:
    python simulator/event_simulator.py                     # Mixed scenarios (default)
    python simulator/event_simulator.py --scenario brute_force
    python simulator/event_simulator.py --count 50          # Send 50 events
    python simulator/event_simulator.py --interval 2        # 2 second pause between events
    python simulator/event_simulator.py --api http://localhost:8000
"""
import argparse
import asyncio
import json
import logging
import random
import sys
import time
from datetime import datetime
from typing import Optional

import httpx

# Try to use rich for pretty output
try:
    from rich.console import Console
    from rich.table import Table
    from rich import print as rprint
    console = Console()
    HAS_RICH = True
except ImportError:
    HAS_RICH = False
    console = None

# Add project root to path
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from simulator.scenarios import (
    SCENARIOS, SCENARIO_WEIGHTS, SimulatedEvent,
    ssh_brute_force_scenario, port_scan_scenario
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

SEVERITY_COLORS = {
    "critical": "bold red",
    "high": "red",
    "medium": "yellow",
    "low": "blue",
    "info": "dim",
}


def _print(msg: str, style: str = ""):
    if HAS_RICH:
        console.print(msg, style=style)
    else:
        print(msg)


async def send_event(client: httpx.AsyncClient, api_url: str, event: SimulatedEvent) -> bool:
    """Send a single event to the API ingestion endpoint."""
    payload = {
        "source_ip": event.source_ip,
        "event_type": event.event_type,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    # Optional fields
    for field in ["destination_ip", "service", "username", "port", "hostname", "message", "severity"]:
        val = getattr(event, field, None)
        if val is not None:
            payload[field] = val

    try:
        response = await client.post(f"{api_url}/api/events", json=payload, timeout=10)
        return response.status_code == 201
    except Exception as e:
        logger.error(f"Failed to send event: {e}")
        return False


async def run_scenario(
    api_url: str,
    scenario_name: str,
    attacker_ip: Optional[str] = None,
) -> int:
    """Run a specific attack scenario."""
    scenario_fn = SCENARIOS.get(scenario_name)
    if not scenario_fn:
        _print(f"[red]Unknown scenario: {scenario_name}[/red]")
        return 0

    try:
        if scenario_name in ("brute_force", "port_scan", "auth_burst"):
            events = scenario_fn(attacker_ip)
        else:
            events = scenario_fn()
    except Exception:
        events = scenario_fn()

    _print(f"\n[bold cyan]🎬 Running scenario: {scenario_name.replace('_', ' ').title()}[/bold cyan]")
    _print(f"   Events to send: {len(events)}")

    sent = 0
    async with httpx.AsyncClient() as client:
        for event in events:
            await asyncio.sleep(event.delay_seconds)
            success = await send_event(client, api_url, event)
            if success:
                sent += 1
                severity = event.severity or "info"
                color = SEVERITY_COLORS.get(severity, "")
                ts = datetime.utcnow().strftime("%H:%M:%S")
                _print(
                    f"  {ts}  [{severity.upper():8s}] {event.event_type:30s} "
                    f"src={event.source_ip}",
                    style=color,
                )
            else:
                _print(f"  ⚠️  Failed to send {event.event_type}", style="red")

    _print(f"  ✅ Scenario complete: {sent}/{len(events)} events sent\n")
    return sent


async def run_mixed(api_url: str, count: int, interval: float):
    """Run a continuous mixed simulation."""
    _print(f"\n[bold green]🛡️  SentinelX Event Simulator[/bold green]")
    _print(f"   Target API: {api_url}")
    _print(f"   Mode: Mixed scenarios")
    _print(f"   Events: {count}")
    _print(f"   Interval: {interval}s\n")
    _print("[dim]Press Ctrl+C to stop[/dim]\n")

    # Build weighted scenario list
    weighted = []
    for name, weight in SCENARIO_WEIGHTS.items():
        weighted.extend([name] * weight)

    total_sent = 0
    scenario_runs = 0

    async with httpx.AsyncClient() as client:
        while total_sent < count:
            scenario_name = random.choice(weighted)
            scenario_fn = SCENARIOS[scenario_name]

            try:
                if scenario_name in ("brute_force", "port_scan", "auth_burst"):
                    events = scenario_fn()
                else:
                    events = scenario_fn()
            except Exception:
                events = scenario_fn()

            scenario_runs += 1
            scenario_sent = 0

            for event in events:
                if total_sent >= count:
                    break
                await asyncio.sleep(event.delay_seconds)
                success = await send_event(client, api_url, event)
                if success:
                    total_sent += 1
                    scenario_sent += 1
                    severity = event.severity or "info"
                    color = SEVERITY_COLORS.get(severity, "")
                    ts = datetime.utcnow().strftime("%H:%M:%S")
                    _print(
                        f"  {ts}  [{severity.upper():8s}] {event.event_type:30s} "
                        f"src={event.source_ip}",
                        style=color,
                    )

            await asyncio.sleep(interval)

    _print(f"\n[bold green]✅ Simulation complete![/bold green]")
    _print(f"   Total events sent: {total_sent}")
    _print(f"   Scenarios run: {scenario_runs}")


def main():
    parser = argparse.ArgumentParser(description="SentinelX Security Event Simulator")
    parser.add_argument("--api", default="http://localhost:8000", help="Backend API URL")
    parser.add_argument("--scenario", default="mixed", help=f"Scenario to run. Options: {', '.join(list(SCENARIOS.keys()) + ['mixed'])}")
    parser.add_argument("--count", type=int, default=100, help="Number of events to generate (mixed mode)")
    parser.add_argument("--interval", type=float, default=1.0, help="Seconds between scenarios (mixed mode)")
    parser.add_argument("--attacker-ip", default=None, help="Force a specific attacker IP")
    args = parser.parse_args()

    if args.scenario == "mixed":
        asyncio.run(run_mixed(args.api, args.count, args.interval))
    elif args.scenario in SCENARIOS:
        asyncio.run(run_scenario(args.api, args.scenario, args.attacker_ip))
    else:
        print(f"Unknown scenario '{args.scenario}'. Valid options: mixed, {', '.join(SCENARIOS.keys())}")
        sys.exit(1)


if __name__ == "__main__":
    main()
