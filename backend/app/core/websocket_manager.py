import json
import logging
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections and broadcasts messages to all connected clients."""

    def __init__(self):
        # Map of connection_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, connection_id: str) -> None:
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        logger.info(f"WebSocket connected: {connection_id}. Total: {len(self.active_connections)}")

    def disconnect(self, connection_id: str) -> None:
        self.active_connections.pop(connection_id, None)
        logger.info(f"WebSocket disconnected: {connection_id}. Total: {len(self.active_connections)}")

    async def send_personal(self, message: dict, connection_id: str) -> None:
        """Send a message to a specific connection."""
        ws = self.active_connections.get(connection_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception as e:
                logger.warning(f"Failed to send to {connection_id}: {e}")
                self.disconnect(connection_id)

    async def broadcast(self, message: dict) -> None:
        """Broadcast a message to all connected clients."""
        if not self.active_connections:
            return
        
        dead_connections = []
        payload = json.dumps(message)
        
        for conn_id, ws in self.active_connections.items():
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Broadcast failed for {conn_id}: {e}")
                dead_connections.append(conn_id)
        
        for conn_id in dead_connections:
            self.disconnect(conn_id)

    async def broadcast_event(self, event_data: dict) -> None:
        """Broadcast a security event to all listeners."""
        await self.broadcast({"type": "new_event", "data": event_data})

    async def broadcast_incident(self, incident_data: dict) -> None:
        """Broadcast a new incident to all listeners."""
        await self.broadcast({"type": "new_incident", "data": incident_data})

    async def broadcast_incident_update(self, incident_data: dict) -> None:
        """Broadcast an incident status update."""
        await self.broadcast({"type": "incident_update", "data": incident_data})

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# Global singleton used across the app
ws_manager = WebSocketManager()
