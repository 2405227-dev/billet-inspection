import time
import uuid
import logging
from enum import Enum
from typing import Dict, Any, Optional, Set, List

logger = logging.getLogger("billet.tracker")

class BilletState(str, Enum):
    DETECTED = "DETECTED"
    INSPECTING = "INSPECTING"
    MEASURING = "MEASURING"
    OCR = "OCR"
    DEFECT_ANALYSIS = "DEFECT_ANALYSIS"
    DECISION = "DECISION"
    COMPLETED = "COMPLETED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"

class TrackedBilletSession:
    def __init__(
        self,
        session_id: str,
        billet_id: str,
        heat_number: str,
        batch_id: str,
        conveyor_entry_time: float,
        initial_position_mm: float = 0.0,
    ):
        self.session_id = session_id # Unique session per physical billet
        self.billet_id = billet_id
        self.heat_number = heat_number
        self.batch_id = batch_id
        self.entry_time = conveyor_entry_time
        self.position_mm = initial_position_mm
        self.state = BilletState.DETECTED
        self.state_history: List[Dict[str, Any]] = [
            {"state": self.state.value, "timestamp": self.entry_time}
        ]
        self.associated_frame_ids: List[int] = []
        self.is_completed = False
        self.inspection_id: Optional[str] = None

    def transition_to(self, new_state: BilletState):
        self.state = new_state
        self.state_history.append({"state": new_state.value, "timestamp": time.time()})
        logger.debug(f"Billet {self.billet_id} ({self.session_id}) transitioned to {new_state.value}")

    def update_position(self, conveyor_speed_m_s: float, dt: float):
        self.position_mm += (conveyor_speed_m_s * 1000.0) * dt

class BilletTracker:
    """
    Real-time Industrial Conveyor Tracking & Duplicate Inspection Prevention Engine.
    Ensures every physical billet produces exactly ONE inspection record across its trajectory.
    """
    def __init__(self):
        self.active_sessions: Dict[str, TrackedBilletSession] = {} # session_id -> Session
        self.completed_billet_ids: Set[str] = set() # Sliding window of finished billets
        self.conveyor_inspection_zone_length_mm = 7500.0
        self.conveyor_speed_m_s = 0.85
        self.inspection_counter = 1

    def generate_inspection_id(self) -> str:
        # Format: INS-YYYY-NNNNNN (unique millisecond timestamp + monotonic counter suffix)
        year = time.strftime("%Y")
        cnt = self.inspection_counter
        self.inspection_counter += 1
        unique_suffix = f"{(int(time.time() * 1000) + cnt) % 900000 + 100000:06d}"
        return f"INS-{year}-{unique_suffix}"

    def register_or_get_billet(
        self,
        billet_id: str,
        heat_number: str,
        batch_id: str,
        frame_idx: int,
    ) -> TrackedBilletSession:
        """
        Check if billet is currently in inspection zone.
        If already tracked, return existing session to prevent duplicate inspection.
        If new, initialize tracked inspection session.
        """
        # 1. Search active sessions
        for session in self.active_sessions.values():
            if session.billet_id == billet_id:
                session.associated_frame_ids.append(frame_idx)
                return session

        # 2. Search recently completed sessions within sliding window
        if billet_id in self.completed_billet_ids:
            # Return a session marked as completed to prevent duplicate re-inspection
            dummy_session = TrackedBilletSession(
                session_id=f"TRACK-COMPLETED-{billet_id}",
                billet_id=billet_id,
                heat_number=heat_number,
                batch_id=batch_id,
                conveyor_entry_time=time.time(),
                initial_position_mm=self.conveyor_inspection_zone_length_mm,
            )
            dummy_session.is_completed = True
            dummy_session.state = BilletState.COMPLETED
            return dummy_session

        # 3. Create fresh tracking session
        session_id = f"TRACK-{uuid.uuid4().hex[:8].upper()}"
        session = TrackedBilletSession(
            session_id=session_id,
            billet_id=billet_id,
            heat_number=heat_number,
            batch_id=batch_id,
            conveyor_entry_time=time.time(),
            initial_position_mm=0.0,
        )
        session.associated_frame_ids.append(frame_idx)
        session.inspection_id = self.generate_inspection_id()
        self.active_sessions[session_id] = session
        logger.info(f"New billet detected: {billet_id} [Session: {session_id}, Assigned Inspection ID: {session.inspection_id}]")
        return session

    def mark_completed(self, session_id: str):
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            session.transition_to(BilletState.COMPLETED)
            session.is_completed = True
            self.completed_billet_ids.add(session.billet_id)
            # Remove from active tracking
            del self.active_sessions[session_id]

    def reset_history(self):
        self.active_sessions.clear()
        self.completed_billet_ids.clear()

billet_tracker = BilletTracker()
