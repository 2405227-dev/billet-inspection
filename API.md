# REST API & WebSocket Protocol Reference

> **API Server Base URL**: `http://localhost:8000`  
> **Interactive Documentation (Swagger)**: `http://localhost:8000/docs`

---

## 📡 Endpoints Summary

### System & Health
- `GET /health`: Returns service health, uptime, version, and active cameras.

### Inspections
- `GET /api/inspections`: List inspections with search, filtering, and pagination.
  - Query parameters: `search`, `status`, `heat_number`, `batch_id`, `defect_type`, `limit`, `offset`.
- `GET /api/inspections/{id}`: Detailed inspection record including dimensions, OCR, defects, audit hash, and crops.
- `POST /api/inspections/trigger`: Manually trigger inspection cycle with scenario overrides.

### Reports & Data Exports
- `GET /api/inspections/{id}/report`: Download official Single Billet PDF Inspection Certificate.
- `GET /api/export/excel`: Download multi-sheet formatted Excel workbook (`billet_inspection_audit.xlsx`).
- `GET /api/export/csv`: Download flat CSV (`inspection_audit.csv` or `defect_details.csv`).
- `GET /api/export/pdf`: Generate Comprehensive Batch Audit PDF Report.

### Cryptographic Audit & Integrity
- `GET /api/audit/verify`: Verifies SHA-256 cryptographic chain across all historical records.
- `POST /api/audit/tamper-test`: Simulates unauthorized direct DB edit to verify instant tamper detection.

### Operator Review & Human-in-the-Loop
- `POST /api/review/{id}`: Submits operator override, disposition, and audit comment.

### Production Line Simulator Controls
- `POST /api/simulator/start?interval_sec=4.0`: Start continuous simulated billet stream.
- `POST /api/simulator/stop`: Stop continuous stream.
- `GET /api/simulator/status`: Current simulation state.
- `POST /api/simulator/step`: Step single simulated billet.

---

## ⚡ Real-Time WebSocket Feeds

### 1. Live Inspection Stream
- **URL**: `ws://localhost:8000/ws/inspection`
- **Events**:
  - `INSPECTION_COMPLETED`: Emitted whenever a billet completes full inspection cycle.

### 2. Immediate Operator Alerts Feed
- **URL**: `ws://localhost:8000/ws/alerts`
- **Events**:
  - `OPERATOR_ALERT`: Emitted immediately upon critical defect, out-of-tolerance dimension, or low-confidence event.
