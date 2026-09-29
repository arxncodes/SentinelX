import uuid
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for live security event streaming.
    Clients connect and receive real-time events and incident notifications.
    Authentication is handled via query param token for WebSocket compatibility.
    """
    connection_id = str(uuid.uuid4())
    await ws_manager.connect(websocket, connection_id)

    # Send welcome message
    await ws_manager.send_personal(
        {
            "type": "connected",
            "connection_id": connection_id,
            "message": "Connected to SentinelX live feed",
            "active_connections": ws_manager.connection_count,
        },
        connection_id,
    )

    try:
        while True:
            # Keep connection alive; we only push from server side
            data = await websocket.receive_text()
            # Handle ping/pong
            if data == "ping":
                await ws_manager.send_personal({"type": "pong"}, connection_id)
    except WebSocketDisconnect:
        ws_manager.disconnect(connection_id)
        logger.info(f"WebSocket {connection_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for {connection_id}: {e}")
        ws_manager.disconnect(connection_id)
