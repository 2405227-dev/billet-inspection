import asyncio
import json
import logging
from typing import Set, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("billet.events")

class ConnectionManager:
    def __init__(self):
        self.active_inspection_connections: Set[WebSocket] = set()
        self.active_alert_connections: Set[WebSocket] = set()

    async def connect_inspection(self, websocket: WebSocket):
        await websocket.accept()
        self.active_inspection_connections.add(websocket)
        logger.info(f"WebSocket client connected to inspection feed. Total: {len(self.active_inspection_connections)}")

    def disconnect_inspection(self, websocket: WebSocket):
        self.active_inspection_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected from inspection feed. Total: {len(self.active_inspection_connections)}")

    async def connect_alert(self, websocket: WebSocket):
        await websocket.accept()
        self.active_alert_connections.add(websocket)
        logger.info(f"WebSocket client connected to alert feed. Total: {len(self.active_alert_connections)}")

    def disconnect_alert(self, websocket: WebSocket):
        self.active_alert_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected from alert feed. Total: {len(self.active_alert_connections)}")

    async def broadcast_inspection(self, event_type: str, data: Dict[str, Any]):
        """Broadcast live inspection lifecycle / completed inspection event to all connected clients."""
        payload = {
            "type": event_type, # "BILLET_FRAME", "INSPECTION_UPDATE", "INSPECTION_COMPLETED"
            "data": data,
        }
        message = json.dumps(payload, default=str)
        dead_sockets = []
        for socket in self.active_inspection_connections:
            try:
                await socket.send_text(message)
            except Exception:
                dead_sockets.append(socket)
        for s in dead_sockets:
            self.active_inspection_connections.discard(s)

    async def broadcast_alert(self, alert_data: Dict[str, Any]):
        """Broadcast immediate real-time operator alert."""
        message = json.dumps({"type": "OPERATOR_ALERT", "data": alert_data}, default=str)
        dead_sockets = []
        for socket in self.active_alert_connections:
            try:
                await socket.send_text(message)
            except Exception:
                dead_sockets.append(socket)
        for s in dead_sockets:
            self.active_alert_connections.discard(s)

manager = ConnectionManager()
