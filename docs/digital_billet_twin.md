# BilletVision: Digital Billet Twin Lifecycle

## 1. What is a Digital Billet Twin?
A **Digital Billet Twin** is not merely a 3D visual model. It is the comprehensive, immutable digital record of one physical billet throughout its entire metallurgical inspection lifecycle.

---

## 2. Digital Twin Data Model

### 2.1 Identity
- `billet_id`: Unique identifier (e.g. `BILLET-00012`).
- `heat_number`: Metallurgical heat (e.g. `26A-1042`).
- `batch_id`: Production batch (e.g. `BATCH-104`).
- `steel_grade`: Chemical/strength classification (e.g. `IS 2830 / Fe 500D`).

### 2.2 Calibrated Geometry
- Length ($L$), Width ($W$), Height ($H$), Diagonal ($D$), Camber ($C$), Rhomboidity ($\theta$).
- Laser 3D surface height profile and roughness ($R_a$).

### 2.3 Visual Inspection
- Detected optical defect bounding boxes, lengths, widths, areas, and severities.
- Color-coded segmentation masks and persistent JPEG crop evidence.

### 2.4 Multi-Sensor Non-Destructive Testing (NDT)
- ECA multi-channel impedance amplitudes and phase angles.
- PAUT volumetric reflection echoes and core flaw depths.

### 2.5 Multi-Face Physical Surface Coverage Map
- `TOP`: INSPECTED
- `BOTTOM`: NOT_INSPECTED (roller contact face)
- `LEFT`: INSPECTED
- `RIGHT`: INSPECTED
- `FRONT`: INSPECTED
- `BACK`: INSPECTED

### 2.6 Transparent Decision Explanation
- Root-cause breakdown explaining exactly why the billet received `PASS`, `FAIL`, `REWORK`, or `NEEDS_REVIEW`.

### 2.7 Cryptographic Audit Chain
- SHA-256 block hash linked to parent hash ($H_n = \text{SHA256}(H_{n-1} \parallel \text{Payload}_n)$).
