"""
Attack scenario definitions for the SentinelX event simulator.
Each scenario is a sequence of events that simulate a real attack pattern.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import random


@dataclass
class SimulatedEvent:
    event_type: str
    source_ip: str
    service: Optional[str] = None
    username: Optional[str] = None
    destination_ip: Optional[str] = None
    port: Optional[int] = None
    hostname: Optional[str] = None
    message: Optional[str] = None
    severity: Optional[str] = None
    delay_seconds: float = 0.5  # Delay before sending this event


# Common attacker IPs
ATTACKER_IPS = [
    "185.220.101.47",
    "198.235.24.155",
    "91.92.251.103",
    "45.142.212.100",
    "194.165.16.78",
    "5.188.86.172",
    "103.124.105.82",
    "179.43.128.251",
]

# Internal asset IPs (targets)
TARGET_IPS = [
    "10.0.1.10",
    "10.0.1.20",
    "10.0.2.10",
    "10.0.0.5",
]

# Common usernames used in attacks
ATTACK_USERNAMES = ["admin", "root", "ubuntu", "user", "test", "postgres", "deploy", "git", "jenkins"]
LEGIT_USERNAMES = ["alice", "bob", "charlie", "diana", "evan"]


def ssh_brute_force_scenario(attacker_ip: Optional[str] = None) -> List[SimulatedEvent]:
    """Simulate an SSH brute-force attack: many failures, then optionally a success."""
    ip = attacker_ip or random.choice(ATTACKER_IPS)
    target = random.choice(TARGET_IPS)
    num_failures = random.randint(8, 25)
    
    events = []
    for i in range(num_failures):
        username = random.choice(ATTACK_USERNAMES)
        events.append(SimulatedEvent(
            event_type="authentication_failure",
            source_ip=ip,
            destination_ip=target,
            service="ssh",
            username=username,
            hostname=f"jumpbox-{random.randint(1, 3):02d}",
            message=f"Failed password for {username} from {ip} port {random.randint(49000, 65000)} ssh2",
            severity="medium",
            delay_seconds=random.uniform(0.1, 0.5),
        ))
    
    # 30% chance of successful brute-force
    if random.random() < 0.3:
        events.append(SimulatedEvent(
            event_type="authentication_success",
            source_ip=ip,
            destination_ip=target,
            service="ssh",
            username=random.choice(ATTACK_USERNAMES),
            hostname="jumpbox-01",
            message=f"Accepted password for root from {ip} ssh2",
            severity="high",
            delay_seconds=0.3,
        ))

    return events


def port_scan_scenario(attacker_ip: Optional[str] = None) -> List[SimulatedEvent]:
    """Simulate a port scan across multiple ports."""
    ip = attacker_ip or random.choice(ATTACKER_IPS)
    target = random.choice(TARGET_IPS)
    ports = random.sample([22, 80, 443, 3306, 5432, 6379, 8080, 8443, 27017, 9200, 3389, 21, 25, 53], 
                          k=random.randint(5, 12))
    
    events = []
    for port in ports:
        events.append(SimulatedEvent(
            event_type="port_scan",
            source_ip=ip,
            destination_ip=target,
            port=port,
            message=f"Port scan detected: {ip}:{port} -> {target}",
            severity="medium",
            delay_seconds=random.uniform(0.05, 0.3),
        ))
    return events


def suspicious_login_scenario(attacker_ip: Optional[str] = None) -> List[SimulatedEvent]:
    """Simulate a suspicious login from an unusual location."""
    ip = attacker_ip or random.choice(ATTACKER_IPS)
    username = random.choice(LEGIT_USERNAMES)
    target = random.choice(TARGET_IPS)
    
    return [
        SimulatedEvent(
            event_type="suspicious_login",
            source_ip=ip,
            destination_ip=target,
            service=random.choice(["vpn", "rdp", "web-app"]),
            username=username,
            message=f"Login from unusual geolocation for {username}",
            severity="high",
            delay_seconds=0.5,
        )
    ]


def normal_activity_scenario() -> List[SimulatedEvent]:
    """Simulate normal day-to-day authentication activity."""
    ip = f"192.168.{random.randint(1, 10)}.{random.randint(1, 254)}"
    username = random.choice(LEGIT_USERNAMES)
    target = random.choice(TARGET_IPS)
    
    return [
        SimulatedEvent(
            event_type="authentication_success",
            source_ip=ip,
            destination_ip=target,
            service=random.choice(["ssh", "web", "vpn"]),
            username=username,
            message=f"Accepted publickey for {username}",
            severity="info",
            delay_seconds=random.uniform(0.5, 2.0),
        )
    ]


def auth_failure_burst_scenario(attacker_ip: Optional[str] = None) -> List[SimulatedEvent]:
    """Simulate a burst of auth failures across multiple services."""
    ip = attacker_ip or random.choice(ATTACKER_IPS)
    target = random.choice(TARGET_IPS)
    
    events = []
    services = ["ssh", "ftp", "smtp", "rdp", "api"]
    for _ in range(random.randint(12, 20)):
        service = random.choice(services)
        username = random.choice(ATTACK_USERNAMES)
        events.append(SimulatedEvent(
            event_type="authentication_failure",
            source_ip=ip,
            destination_ip=target,
            service=service,
            username=username,
            message=f"Failed authentication on {service} for {username}",
            severity="medium",
            delay_seconds=random.uniform(0.05, 0.2),
        ))
    return events


def malware_detection_scenario() -> List[SimulatedEvent]:
    """Simulate a malware detection event."""
    ip = f"10.0.{random.randint(1, 4)}.{random.randint(5, 100)}"
    
    return [
        SimulatedEvent(
            event_type="malware_detection",
            source_ip=ip,
            service="antivirus",
            message=f"Malware detected: Trojan.GenericKD.{random.randint(10000, 99999)}",
            severity="critical",
            delay_seconds=1.0,
        )
    ]


# Scenario registry
SCENARIOS = {
    "brute_force": ssh_brute_force_scenario,
    "port_scan": port_scan_scenario,
    "suspicious_login": suspicious_login_scenario,
    "normal": normal_activity_scenario,
    "auth_burst": auth_failure_burst_scenario,
    "malware": malware_detection_scenario,
}

# Weighted random scenario selection (for mixed simulation)
SCENARIO_WEIGHTS = {
    "brute_force": 25,
    "port_scan": 20,
    "suspicious_login": 10,
    "normal": 30,
    "auth_burst": 10,
    "malware": 5,
}
