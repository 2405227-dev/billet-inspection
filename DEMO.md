# Live Demonstration Walkthrough Guide

> Follow this step-by-step procedure to demonstrate the full inspection, metrology, OCR, audit, and export pipeline.

---

## 🎬 Step-by-Step Judge / Evaluator Demo Script

### Step 1: Start the Platform
1. Launch Backend: `.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000`
2. Launch Frontend: `cd frontend && npm run dev`
3. Open browser to **`http://localhost:3000`**.
4. Observe the dark industrial Command Center with live KPI cards, active conveyor speed, and camera HUD.

### Step 2: Continuous Production Simulator
1. In the top navbar, click **"Auto Run"**.
2. Observe simulated billets appearing continuously across the conveyor feed.
3. Watch the real-time WebSocket updates:
   - Defect bounding boxes & segmentation overlays dynamically appear on the camera feed.
   - Live dimensional measurements ($L, W, H$) and OCR Heat/Batch markings update.
   - Total billet counters, pass rate percentages, and latency graphs increment in real time.
4. Click **"Stop Feed"** when desired.

### Step 3: Manual Step & Scenario Injection
1. Navigate to **"Live Inspection"** in the sidebar (`/inspection`).
2. In the right-hand **"Inspection Trigger Test Bench"**, select a scenario:
   - Select `MAJOR_CRACK` (Longitudinal surface crack &gt; 20mm).
   - Enter Heat Number: `26A-9042`.
   - Click **"Execute Inspection Pass"**.
3. Observe:
   - Camera renders the fine crack with green/amber segmentation overlay.
   - Quality Verdict immediately computes **`REWORK`** (Reason: Longitudinal surface crack detected).
   - Defect table logs length ($42.5\ \text{mm}$), width ($0.8\ \text{mm}$), area ($34.0\ \text{mm}^2$), and orientation.
   - Clicking **"Zoom Crop"** displays the $\times 4$ optical evidence crop.

### Step 4: Full Traceability Registry
1. Navigate to **"Every Billet Record"** (`/inspections`).
2. Notice every single inspected billet is permanently recorded in the database.
3. In the search box, search for `26A-9042`. The record is immediately filtered.

### Step 5: Individual Billet Inspection Deep-Dive
1. Click **"View"** on any inspection.
2. The full Inspection Detail page opens (`/inspections/[id]`):
   - Review the complete 4K visual evidence composite.
   - Inspect the sub-millimeter Dimensional Metrology tolerance bars.
   - Verify the OCR Heat stencil crop.
   - Review the NDT sensor fusion card.
   - Inspect the SHA-256 Audit Hash block.

### Step 6: Print Official PDF Inspection Certificate
1. Click **"Print Inspection Certificate (PDF)"**.
2. A printable PDF report opens, complete with plant headers, dimensional tables, defect log, and QA officer signature lines.

### Step 7: Cryptographic Audit Verification & Tamper Test
1. Navigate to **"Audit Trail & Verification"** (`/audit`).
2. Click **"Verify Audit Chain"**.
   - System recalculates the cryptographic hash chain across all records.
   - Displays **`✓ AUDIT VERIFIED`**.
3. Click **"Simulate DB Tamper"** to test anti-tampering detection:
   - System alters a historical record behind the scenes.
   - Instantly triggers **`⚠ AUDIT INTEGRITY FAILURE`** and highlights the exact tampered record index!
4. Click **"Verify Audit Chain"** again after reloading to verify restored chain.

### Step 8: Multi-Sheet Excel & Batch Reports
1. In the Audit Center, click **"Master Audit Workbook (.xlsx)"**.
2. Open the downloaded `billet_inspection_audit.xlsx` in Excel or spreadsheet viewer:
   - **Sheet 1 (`Inspection Audit`)**: One row per physical billet.
   - **Sheet 2 (`Defect Details`)**: Granular defect dimensions and coordinates.
   - **Sheet 3 (`Audit Summary`)**: Aggregate yield KPIs and OCR statistics.
