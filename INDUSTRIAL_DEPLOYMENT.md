# Industrial Plant Deployment & PLC Integration Guide

> **Target Environment**: Continuous Casting Machine (CCM) Run-out Table & Cooling Bed Station

---

## 🏭 Optical Rig & Lighting Mechanical Setup

```
                     ┌───────────────────────────────┐
                     │     Polarized White LED Array │
                     └───────────────┬───────────────┘
                                     │
                     ┌───────────────▼───────────────┐
                     │ CAM-01: 4K Nadir Matrix (Top) │
                     └───────────────┬───────────────┘
                                     │ (2200mm Working Dist)
                                     ▼
 [Conveyor Roller] ===== [ Physical Steel Billet ] ===== [Conveyor Roller]
                                     ▲
                                     │ (1800mm Working Dist)
                     ┌───────────────┴───────────────┐
                     │ CAM-02: Line Scan 8K (Bottom) │
                     └───────────────────────────────┘
```

---

## ⚡ PLC & Diverter Automation Interface

The `PLCAdapter` connects directly to plant automation PLCs (Siemens S7-1500, Allen-Bradley ControlLogix, or Beckhoff TwinCAT) via **OPC-UA** or **Modbus TCP**:

```
[ Billet Quality Decision: FAIL ]
                │
                ▼
      [ PLCAdapter.send_decision() ]
                │
                ▼
   [ Tag: "DB10.DischargeDiverter" = TRUE ]
                │
                ▼
   [ Pneumatic Reject Kicker Activates ] ───► Billet pushed to Reject Bay #1
```

- **PASS**: Normal line transit through rolling mill.
- **REWORK**: Diverter routes billet to conditioning & scarfing buffer.
- **FAIL**: Kicker pushes billet to scrap / remelt conveyor.
- **NEEDS_REVIEW / HOLD**: Conveyor speed slows; warning stack-light illuminates at operator station.
