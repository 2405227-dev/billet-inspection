# BilletVision UI Design System & Component Architecture
*Unified Industrial AI Design Language Derived from E-Cell, E-Summit, and CaeliFi*

---

## 1. Executive Summary & Design Heritage

The **BilletVision** frontend redesign adapts the visual pedigree, motion choreography, and component architecture developed across:
1. **KIIT E-Cell & E-Summit Platforms**: Resizable floating glassmorphic navbar with spring scroll physics, `layoutId` pill hover transitions, interactive mobile drawer, and high-contrast technical badges.
2. **CaeliFi IoT & AI Platform**: Ambient canvas particle motes (`ParticleField`), radial spotlight glow cards (`GlowCard`), deep obsidian dark mode (`#030712`), high-contrast gradient typography, and precision telemetry metrics.
3. **Aceternity UI / Industrial Computer Vision Integration**: Animated HUD viewports, laser scanning overlays, sub-millimeter metrology callouts, and SHA-256 cryptographic timeline verification.

---

## 2. Design System Component Mapping

| Source Project Component | Source Architecture & Features | BilletVision Industrial Component | Adapted Role & Functionality |
| :--- | :--- | :--- | :--- |
| **E-Cell / E-Summit Navbar** (`resizable-navbar.jsx`, `NavbarD.jsx`) | Floating spring-animated pill (`width: 92% -> 72%`, `y: 0 -> 12px`, `backdrop-blur-xl`, `bg-black/40`), `layoutId="hovered"` pill indicator, mobile drawer menu. | **`BilletNavbar`** (`components/layout/BilletNavbar.tsx`) | Global floating command bar featuring brand logo + status dot, 6 core navigation links with layoutId hover animation, live camera count (`5/5 CAM`), system health badge, and quick operator settings. |
| **CaeliFi Particle Field** (`ParticleField.jsx`) | HTML5 Canvas ambient micro-particles floating upward with dual-color glow (cyan & amber). | **`ParticleField`** (`components/ui/ParticleField.tsx`) | Background ambient optical particle simulation representing steel furnace thermal energy and laser reflection motes. |
| **E-Summit Spotlight GlowCard** (`spotlight-card.tsx`) | Pointer-tracking dynamic radial gradient border (`hsl(--hue)`), custom size, `data-glow` pseudo-elements. | **`GlowCard`** (`components/ui/GlowCard.tsx`) | Interactive KPI metric cards, defect cards, and inspection feature panels with mouse-reactive cyan/amber/emerald spotlight boundaries. |
| **CaeliFi Surface System** (`globals.css`) | `.surface-card`, `.surface-glass`, `.text-gradient-amber`, `.text-gradient-cyan`, `.bg-grid-pattern`. | **`IndustrialDesignTokens`** (`app/globals.css`) | Core CSS design tokens with deep obsidian palette, grid line overlays, subtle border highlights (`rgba(255,255,255,0.08)`), and status glow effects. |
| **CaeliFi Hero Section** (`HeroSection.jsx`) | Staggered `framer-motion` entrance (`ease: [0.16, 1, 0.3, 1]`), industry badge pill with live pulse, high-impact headline, stats strip. | **`CommandCenterHero`** (`components/dashboard/CommandCenterHero.tsx`) | High-impact industrial hero introducing real-time billet conveyor telemetry, active heat batch, cycle time, and direct quick-action buttons. |
| **E-Summit Grid Boxes** (`background-boxes.tsx`) | Skewed 3D matrix with reactive color hover squares. | **`IndustrialGridBackground`** (`components/ui/IndustrialGridBackground.tsx`) | Perspective grid background providing depth to the inspection viewport and analytics dashboards. |

---

## 3. Color Hierarchy & Industrial Semantics

All colors follow functional industrial inspection gating rules:
- **Obsidian Dark Surface**: `#030712` (Base Canvas), `#0b0f19` (Elevated Surface), `#111827` (Card Background).
- **Emerald Green (`#10b981`)**: **`PASS`** — Billet strictly conforms to dimensional tolerances ($\le \pm 1.0\%$) and surface defect thresholds ($\le 25\ \text{mm}$).
- **Amber Warning (`#f59e0b`)**: **`REWORK`** — Defect remediable via grinding/conditioning or minor length trim.
- **Crimson Red (`#ef4444`)**: **`FAIL`** — Critical structural flaws, deep longitudinal cracks ($> 40\ \text{mm}$), severe rhomboidity, or off-spec dimensions.
- **Sunflower Yellow (`#eab308`)**: **`NEEDS REVIEW`** — Low-confidence OCR reading, sensor discrepancy, or operator sign-off required.
- **Electric Cyan (`#06b6d4`) & Cobalt Blue (`#3b82f6`)**: **`AI / SYSTEM / METROLOGY`** — Laser scan lines, bounding boxes, optical flow, homography grid, and active telemetry.

---

## 4. Typography Scale

- **Display & Headings**: `Plus Jakarta Sans` / `Inter` / `Geist Sans` with `-0.03em` letter-spacing, uppercase accents, and tight leading.
- **Monospace Telemetry**: `JetBrains Mono` / `Geist Mono` for all Heat/Batch IDs, dimensions ($L \times W \times H\ \text{mm}$), SHA-256 cryptographic hashes, frame timestamps, and FPS/latency metrics.

---

## 5. Motion & Interaction Principles

1. **Spring-Based Natural Motion**: Navigation bar resizing and card expansions utilize spring physics (`stiffness: 200, damping: 25`).
2. **Staggered Orchestration**: Page loads stagger entrance reveals by `0.06s` per section to create a cohesive command-center boot sequence.
3. **Subtle Scanning Overlays**: Live camera feeds feature continuous micro-scanning lasers without triggering high GPU re-draw costs.
4. **Layout Continuity**: Tab and filter switches use Framer Motion `layoutId` to animate active background pills seamlessly without layout jitter.
