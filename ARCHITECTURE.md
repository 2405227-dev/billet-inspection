# System Architecture & Technical Specifications

> **System**: AI-Powered Industrial Billet Inspection, Traceability & Audit Platform  
> **Document Version**: 2.4.0-PROD

---

## 🏛️ High-Level System Architecture

```
                               ┌───────────────────────────────────────────────┐
                               │             INDUSTRIAL CONVEYOR LINE          │
                               │  Continuous Casting & Secondary Cooling Bed   │
                               └──────────────────────┬────────────────────────┘
                                                      │
                       ┌──────────────────────────────┴─────────────────────────────┐
                       ▼                                                            ▼
         ┌───────────────────────────┐                                ┌───────────────────────────┐
         │     OPTICAL CAMERA RIG    │                                │     NDT SENSOR CHANNELS   │
         │ CAM-01: Top Nadir Matrix  │                                │ - Eddy Current Array (ECA)│
         │ CAM-02: Bottom Line Scan  │                                │ - Ultrasonic Testing (UT) │
         │ CAM-03: Left Profile      │                                └─────────────┬─────────────┘
         │ CAM-04: Right Profile     │                                              │
         │ CAM-05: End Face OCR      │                                              │
         └─────────────┬─────────────┘                                              │
                       │                                                            │
                       ▼                                                            ▼
         ┌───────────────────────────┐                                ┌───────────────────────────┐
         │   CameraProvider Engine   │                                │   NDTSensorFusionEngine   │
         │ GigE / GenICam / Pylon /  │                                │ Multi-modal Confidence &  │
         │ High-Fidelity Demo Source │                                │ Conflict Resolution Gate  │
         └─────────────┬─────────────┘                                └─────────────┬─────────────┘
                       │                                                            │
                       ▼                                                            │
         ┌───────────────────────────┐                                              │
         │    BilletTracker Engine   │ ◄── (1 Physical Billet = 1 Immutable Record) │
         │ Conveyor State Machine    │                                              │
         └─────────────┬─────────────┘                                              │
                       │                                                            │
         ┌─────────────┴─────────────────────────────────────────────┐              │
         │             PARALLEL CV & METROLOGY PIPELINES             │              │
         │                                                           │              │
         │  ┌───────────────────────┐   ┌──────────────────────────┐ │              │
         │  │ Dimensional Metrology │   │ Surface Defect & Cracks  │ │              │
         │  │ - Homography Matrix   │   │ - CLAHE Illumination Cor.│ │              │
         │  │ - Sub-mm Distortion   │   │ - 256px Tiled Seg.       │ │              │
         │  │ - Length/Width/Height │   │ - Morphological Skeleton │ │              │
         │  └───────────┬───────────┘   └────────────┬─────────────┘ │              │
         │              │                            │               │              │
         │  ┌───────────┴───────────┐   ┌────────────┴─────────────┐ │              │
         │  │ Billet OCR Marking    │   │ 2D Barcode / DataMatrix  │ │              │
         │  │ - PaddleOCR Adapter   │   │ - QR Code & Code128      │ │              │
         │  │ - Heat/Batch Regex    │   │ - Physical Label ID      │ │              │
         │  └───────────┬───────────┘   └────────────┬─────────────┘ │              │
         └──────────────┼────────────────────────────┼───────────────┘              │
                        └────────────────────┬───────┘                              │
                                             ▼                                      │
                               ┌───────────────────────────┐                        │
                               │   QualityDecisionEngine   │ ◄──────────────────────┘
                               │ Tolerance Evaluation &    │
                               │ Metallurgical Acceptance  │
                               └─────────────┬─────────────┘
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             ▼                               ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│       PLC ADAPTER       │     │     OPERATOR ALERTS     │     │     EVIDENCE STORAGE    │
│ OPC-UA / Modbus-TCP /   │     │ WebSocket Real-Time     │     │ 4K Frames, Defect Crops,│
│ Diverter Reject Kicker  │     │ Broadcast Dispatch Hub  │     │ Segmentation Mask Maps  │
└─────────────────────────┘     └─────────────────────────┘     └────────────┬────────────┘
                                                                             │
                                                                             ▼
                                                                ┌─────────────────────────┐
                                                                │  RELATIONAL DATABASE    │
                                                                │ SQLAlchemy (SQLite / PG)│
                                                                │ Central Inspection Model│
                                                                └────────────┬────────────┘
                                                                             │
                                                                             ▼
                                                                ┌─────────────────────────┐
                                                                │   SHA-256 HASH CHAIN    │
                                                                │ H_n = SHA256(H_(n-1)+D) │
                                                                │ Immutable Audit Trail   │
                                                                └────────────┬────────────┘
                                                                             │
                                               ┌─────────────────────────────┴─────────────────────────────┐
                                               ▼                                                           ▼
                                ┌─────────────────────────────┐                             ┌─────────────────────────────┐
                                │   OpenPyXL Excel Reports    │                             │    ReportLab PDF Reports    │
                                │ 3-Sheet Inspection Workbook │                             │ Billet QA Certificates &    │
                                │ (Audit, Defects, Summary)   │                             │ Batch Audit Reports         │
                                └─────────────────────────────┘                             └─────────────────────────────┘
```

---

## 🧩 Architectural Principles

1. **Deterministic Single-Billet Lifecycle**:
   Every physical billet moving through the inspection field is assigned a unique session and guaranteed exactly **ONE** immutable inspection record (`INS-YYYY-NNNNNN`).
2. **True Separation of Visible Surface and Subsurface Flaws**:
   Optical sensors strictly evaluate visible top/bottom/lateral surface phenomena. Internal piping and core inclusions are assigned to the `NDTSensorFusionEngine` adapter (Eddy Current & Phased Array UT).
3. **Cryptographic Chaining for Audit Immunity**:
   Every completed inspection payload is hashed together with the previous block's SHA-256 hash, ensuring that historical records cannot be silently modified, deleted, or back-dated without immediately failing integrity checks.
4. **Resilient Hardware Abstraction**:
   The `CameraProvider` and `PLCAdapter` design enables seamless execution in full production with physical GigE/OPC-UA equipment or in 100% autonomous demo simulation mode with high-fidelity synthetic physics.
