# BilletVision: Industrial Inspection Pipeline

## 1. Pipeline State Machine

Every billet traversing the inspection zone is evaluated through a deterministic 14-stage state machine:

```
1. ACQUIRE_IDENTITY         (Photo-eye trigger & BilletTracker session initialization)
       ↓
2. POSITION_ENCODER         (Rotary encoder millimeter position & velocity capture)
       ↓
3. CAMERA_ACQUISITION       (High-resolution 4K optical frame capture)
       ↓
4. METROLOGY_DIMENSIONS     (Sub-pixel contour edge detection, length, width, height, diagonal)
       ↓
5. LASER_3D_SURFACE         (Sheet-of-light triangulation surface height map & roughness)
       ↓
6. OCR_IDENTIFICATION       (End-face marking extraction, CLAHE, Heat & Batch regex parsing)
       ↓
7. DEFECT_SEGMENTATION      (Tiled convolutional multi-scale surface crack segmentation)
       ↓
8. ECA_INSPECTION           (16-channel Eddy Current Array near-surface sweep)
       ↓
9. PAUT_INSPECTION          (Phased Array Ultrasonic volumetric core porosity scan)
       ↓
10. SENSOR_FUSION_DECISION  (Multi-modal cross-correlation & rule evaluation)
       ↓
11. EVIDENCE_PERSISTENCE    (Color-coded defect crops, segmentation masks, raw frames)
       ↓
12. AUDIT_CHAIN_HASH        (SHA-256 cryptographic chaining of inspection record)
       ↓
13. DATABASE_COMMIT         (Relational persistence of Digital Billet Twin entity)
       ↓
14. PLC_DISPOSITION_OUT     (Modbus / OPC-UA pneumatic reject diverter actuation)
```

---

## 2. Stage Execution Latency

| Stage Name | Subsystem | Typical Latency | Hardware Target |
| :--- | :--- | :--- | :--- |
| Optical Capture | GigE Area-Scan | 18 ms | Basler / FLIR 60 FPS |
| Metrology | OpenCV Contour | 24 ms | 0.12 mm Uncertainty |
| OCR Identification | PaddleOCR / Heuristic | 38 ms | End-Face Region |
| Defect Segmentation | Tiled AI Segmentation | 52 ms | Sub-millimeter Cracks |
| NDT Scan (ECA+PAUT) | Simulation HAL | 8 ms | Olympus OmniScan |
| Sensor Fusion | Rule Engine | 4 ms | Real-Time Correlator |
| Audit Ledger Chaining | Cryptographic Engine | 12 ms | SHA-256 Immutable |
| **Total Cycle Time** | **Full Pipeline** | **~156 ms** | **&lt; 2.0 s per Billet** |

---

## 3. Failure & Safe-State Behavior
- **Missing Camera Frame**: Triggers `CAMERA_OFFLINE` alert; sets status `NEEDS_REVIEW`.
- **Low OCR Confidence (&lt;80%)**: Status set to `NEEDS_REVIEW` (never invents ID).
- **Encoder Signal Loss**: Logs `POSITION_UNKNOWN` warning, falls back to time-distance estimation.
- **Conveyor Contact Bottom Surface**: Marked `NOT_INSPECTED` (never marked PASS).
