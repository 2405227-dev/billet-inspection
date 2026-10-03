import asyncio
import random
import logging
import time
from typing import Dict, Any, Optional
from backend.core.database import SessionLocal
from backend.services.pipeline.orchestrator import pipeline_orchestrator

logger = logging.getLogger("billet.simulator")

class DemoProductionSimulator:
    """
    High-Fidelity Industrial Billet Production Line Simulator.
    Simulates continuous billet casting & rolling conveyor line with probabilistic defect distributions.
    Clearly labeled: DEMO / SIMULATION.
    """
    def __init__(self):
        self.is_running = False
        self.interval_sec = 4.0
        self.task: Optional[asyncio.Task] = None
        self.current_heat_number = "26A-1042"
        self.current_batch_id = "BATCH-104"
        self.billet_index = 1001
        self.scenario_distribution = [
            ("NORMAL", 0.55),
            ("MINOR_CRACK", 0.15),
            ("MAJOR_CRACK", 0.12),
            ("DIMENSION_OUT_OF_TOLERANCE", 0.08),
            ("MULTIPLE_DEFECTS", 0.05),
            ("OCR_FAILURE", 0.05),
        ]

    def start(self, interval_sec: float = 4.0):
        if self.is_running:
            return
        self.is_running = True
        self.interval_sec = interval_sec
        self.task = asyncio.create_task(self._run_loop())
        logger.info(f"Demo Production Simulator started (interval: {self.interval_sec}s)")

    def stop(self):
        if not self.is_running:
            return
        self.is_running = False
        if self.task:
            self.task.cancel()
        logger.info("Demo Production Simulator stopped")

    async def _run_loop(self):
        while self.is_running:
            try:
                await self.step_one_billet()
                await asyncio.sleep(self.interval_sec)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in production simulator loop: {e}", exc_info=True)
                await asyncio.sleep(self.interval_sec)

    async def step_one_billet(
        self,
        forced_scenario: Optional[str] = None,
        custom_heat: Optional[str] = None,
        custom_billet_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Executes a single realistic simulated billet pass through the complete inspection pipeline."""
        scenario = forced_scenario or self._choose_scenario()
        
        # Advance Billet & Heat counters
        self.billet_index += 1
        b_id = custom_billet_id or f"BILLET-{self.billet_index:05d}"
        heat_no = custom_heat or self.current_heat_number
        batch_no = self.current_batch_id

        # Occasionally rotate batch / heat
        if self.billet_index % 25 == 0 and not custom_heat:
            self.current_heat_number = f"26A-{random.randint(1043, 9999)}"
            self.current_batch_id = f"BATCH-{random.randint(105, 999)}"

        # Configure parameters based on selected scenario
        defect_type = "NONE"
        sim_length = None
        force_ocr_fail = False

        if scenario == "NORMAL":
            defect_type = "NONE"
            sim_length = round(6000.0 + random.uniform(-25.0, 30.0), 1)
        elif scenario == "MINOR_CRACK":
            defect_type = "hairline_crack"
            sim_length = round(6000.0 + random.uniform(-20.0, 20.0), 1)
        elif scenario == "MAJOR_CRACK":
            defect_type = "longitudinal_crack"
            sim_length = round(6000.0 + random.uniform(-30.0, 30.0), 1)
        elif scenario == "DIMENSION_OUT_OF_TOLERANCE":
            defect_type = "NONE"
            # Outside [5800, 6200]
            sim_length = round(6238.5 + random.uniform(5.0, 40.0), 1)
        elif scenario == "MULTIPLE_DEFECTS":
            defect_type = "scab"
            sim_length = round(5985.0 + random.uniform(-20.0, 20.0), 1)
        elif scenario == "OCR_FAILURE":
            force_ocr_fail = True
            sim_length = 6002.0

        db = SessionLocal()
        try:
            res = await pipeline_orchestrator.execute_inspection(
                db=db,
                billet_id=b_id,
                heat_number=heat_no,
                batch_id=batch_no,
                defect_scenario=defect_type,
                simulated_length=sim_length,
                force_ocr_fail=force_ocr_fail,
                camera_id="CAM-01",
            )
            return {
                "scenario": scenario,
                "inspection": res,
                "is_simulation": True,
            }
        finally:
            db.close()

    def _choose_scenario(self) -> str:
        r = random.random()
        cumulative = 0.0
        for sc, prob in self.scenario_distribution:
            cumulative += prob
            if r <= cumulative:
                return sc
        return "NORMAL"

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "interval_sec": self.interval_sec,
            "current_heat_number": self.current_heat_number,
            "current_batch_id": self.current_batch_id,
            "last_billet_id": f"BILLET-{self.billet_index:05d}",
            "mode": "DEMO / SIMULATION",
        }

simulator_service = DemoProductionSimulator()
