# BilletVision™ Industrial Vision OS — UI Design System Specification
**Project:** AI-Powered Industrial Billet Inspection, Traceability & Audit Platform  
**Location:** NIT Raipur · Cooling Bed & Conveyor Line 01  
**Design Reference:** KIIT E-Cell & CaeliFi UI Frameworks  
**Version:** 2.0.0 (Industrial Vision OS Standard)

---

## 1. Design Philosophy & Vision

BilletVision is engineered as an **Industrial Vision OS** — a high-density, mission-critical interface designed for manufacturing plant operators, metallurgists, quality auditors, and production heads.

### Anti-Patterns Explicitly Avoided:
- ❌ **No Generic SaaS AI Admin Dashboards:** No excessive glowing bubble cards, giant centered hero text, or marketing copy.
- ❌ **No Monochromatic Red Glows:** Red is strictly reserved for physical laser inspection beams, critical defects, and active navigation indicators.
- ❌ **No Monospace Overload:** Monospace is strictly reserved for telemetry, billet serials, heat numbers, dimensions, tolerances, and SHA-256 hashes. Headings use structured, premium grotesque typography (`Inter` / `Plus Jakarta Sans`).

---

## 2. Color Palette & Surface Tokens

| Token Name | Hex Code | HSL Equivalent | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| **Graphite Void** | `#07080b` | `hsl(225, 30%, 4%)` | Primary workspace canvas |
| **Carbon Surface** | `#0c0e14` | `hsl(223, 25%, 6%)` | Panel & card containers |
| **Elevated Surface** | `#12151b` | `hsl(220, 20%, 9%)` | Interactive dropdowns & modals |
| **Laser Red (Primary)** | `#ED1C27` | `hsl(357, 85%, 52%)` | Optical scan beam, critical defects, active nav |
| **Thermal Glow** | `#ff4b55` | `hsl(357, 100%, 65%)` | Laser beam reflection highlights |
| **Conditioning Amber** | `#f59e0b` | `hsl(38, 92%, 50%)` | Rework status, grinding disposition |
| **Inspection Green** | `#10b981` | `hsl(158, 64%, 40%)` | PASS verdict, SHA-256 verified status |
| **Metrology Cyan** | `#38bdf8` | `hsl(199, 89%, 48%)` | Dimensional measurement readouts |

---

## 3. Typography Hierarchy

The typography marries engineering precision with readability:

- **Primary UI & Headings:** `Inter`, `-apple-system`, `system-ui`, `sans-serif`
  - Weight: Medium (500), SemiBold (600), Bold (700)
  - Letter Spacing: `-0.02em` for titles
- **Telemetry & Industrial Data:** `JetBrains Mono`, `ui-monospace`, `monospace`
  - Weight: Regular (400), Medium (500), Bold (700)
  - Used strictly for: Billet IDs (`BILLET-06128`), Heat numbers (`26A-1042`), millimeter dimensions (`6002 mm`), cycle times (`182 ms`), SHA-256 hashes, camera coordinates (`X: 1823 mm, Y: 74 mm`).

---

## 4. Navigation System (`BilletVisionNavbar`)

Derived directly from the **KIIT E-Cell** and **CaeliFi** header architectures:
- **Floating Graphite Bar:** Anchored at `top-4`, bounded container, `bg-[#07080b]/90` with `backdrop-blur-md` and 1px border `border-white/[0.08]`.
- **Active Navigation Indicator:** Subtle bottom red underline indicator (`bg-[#ED1C27]`) rather than large glowing pill enclosures.
- **Real-Time Operational Indicators:**
  - Status beacon: Pulsing green dot with `LINE 01 ONLINE` telemetry.
  - Camera rig status: `05/05 CAM` active counter.
  - Operator badge: `OP-104` with quick human-override capability.
- **Mobile Responsive Drawer:** Collapsible hamburger menu maintaining the exact graphite aesthetic on smaller tablet and phone screens.

---

## 5. Machine Vision Viewport (`InspectionViewport`)

The centerpiece of the application is designed to emulate an industrial vision inspection terminal:
1. **Camera Selector:** Compact `01`, `02`, `03`, `04`, `05` multi-camera switcher with live status dots.
2. **Dynamic Laser Sweep:** CSS-animated red laser beam (`animate-laser-beam`) scanning top-to-bottom across the billet surface.
3. **Corner Reticles:** 4-corner targeting crosshairs (`border-white/20`) providing optical framing.
4. **Telemetry HUD Overlays:**
   - Top HUD: Billet ID, Heat Number, Steel Grade, Camera ID, and Cycle Time.
   - Bottom HUD: Calibrated Dimensions (`L`, `W`, `H`), OCR Confidence, Surface Status, and Cryptographic Hash.
5. **Interactive Controls:** Toggle laser scan line, toggle dimension annotations, toggle 4K optical crop, and full-screen expansion.

---

## 6. Industrial Background System (`IndustrialHeroBackground`)

Layered depth without visual clutter:
1. **Layer 1 (Texture/Image):** Real industrial steel imagery from `/images/industrial/` (steel mill, hot billet conveyor, macro surface texture).
2. **Layer 2 (Darkening Gradient):** Multi-directional gradient vignette (`from-black/90 via-black/70 to-[#07080b]`) preserving foreground contrast and accessibility.
3. **Layer 3 (Technical Grid):** Fine 24px coordinate grid (`rgba(255,255,255,0.03)`).
4. **Layer 4 (Content):** Foreground operational controls, telemetry badges, and data views.

---

## 7. Operational Telemetry Strip (`OperationalTelemetryStrip`)

A horizontal 6-metric operational telemetry strip replacing generic SaaS KPI cards:
1. **BILLETS INSPECTED:** Total shift count with unit telemetry.
2. **PASS RATE:** Percentage with threshold indicators.
3. **ACTIVE DEFECTS:** Live count of detected flaws.
4. **REVIEW QUEUE:** Items flagged for human operator verification.
5. **AVG CYCLE LATENCY:** High-speed processing duration in milliseconds (`~182 ms`).
6. **CAMERAS ONLINE:** Active synchronization counter (`05/05`).

---

## 8. Defect Investigation Console (`/defects`)

A specialized metallurgical investigation bench:
- **Left Viewport:** High-resolution optical tile image with convolutional AI segmentation masks, coordinate tick marks, crosshairs, and 1× / 2× / 4× zoom magnification.
- **Right Telemetry Panel:** Defect classification, severity level, AI confidence, millimeter length & width, surface location, spatial coordinates (`X: 1823 mm, Y: 74 mm`), metallurgical root-cause analysis, and disposition recommendation.

---

## 9. Animation Principles: "Precision, Not Decoration"

All Framer Motion and CSS animations adhere to instrumentation guidelines:
- **Duration:** 150ms to 300ms for UI state changes.
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (snappy ease-out curve).
- **Inspection Scan:** 3.5s smooth continuous linear oscillation.
- **Forbidden:** No random floating elements, bouncing physics, or gratuitous 3D rotations that distract from metrological assessment.

---

## 10. Auditability & Cryptographic Verification (`/audit`)

- SHA-256 block chain linkage for 100% traceability.
- Interactive verification engine that checks hashes across all historical records in the SQLite ledger.
- One-click copy for record hashes, PDF certificate export, and batch Excel reporting.
