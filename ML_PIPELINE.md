# ML Dataset & Fine-Crack Segmentation Pipeline

> **Detection Standard**: Sub-millimeter surface-breaking crack detection, multi-scale CLAHE, and high-resolution overlapping tile inference.

---

## 🔬 Fine Crack & Small Defect Architecture

Standard bounding-box object detectors (e.g. standard YOLO) struggle with hairline cracks because the defect may only be 1 to 3 pixels wide across a 4K frame ($0.0001\%$ of pixel area).

### Multi-Stage Crack Segmentation Pipeline

```
Original High-Res Billet Frame (4096 × 2160)
                     │
                     ▼
           [ Billet ROI Isolation ]
                     │
                     ▼
       [ CLAHE Contrast Enhancement ] ── (Grid 8x8, Clip Limit 3.0)
                     │
                     ▼
     [ Tiled Sliding Window Grid ] ──── (256 × 256 Tiles with 64px Overlap)
                     │
                     ▼
   [ Multi-Scale High-Frequency Filtering ] ─ (Sobel Gradients & Adaptive Edge Paths)
                     │
                     ▼
       [ Tile-Level Segmentation ]
                     │
                     ▼
    [ Global Defect Mask Reconstruction ] ── (Merge overlapping tile probabilities)
                     │
                     ▼
       [ Morphological Skeleton Analysis ] ── (Length, Width, Area, Orientation)
                     │
                     ▼
        [ Defect Severity Grading ] ─────── (CRITICAL, MAJOR, MODERATE, MINOR)
```

---

## 📁 Dataset Splitting & Annotation Guidelines

### CRITICAL RULE: Grouped Splitting by Heat & Billet ID
Data must NEVER be split randomly by frames. If multiple camera views or sequential frames of the same moving billet are randomly assigned across train and test sets, **severe data leakage occurs**, producing falsely optimistic accuracy metrics.

```
dataset/
├── images/
│   ├── HEAT_26A_1042_CAM01_001.jpg
│   ├── HEAT_26A_1042_CAM01_002.jpg
├── masks/
│   ├── HEAT_26A_1042_CAM01_001_mask.png
├── annotations/
│   ├── instances_train.json  # Grouped by Heat
│   ├── instances_val.json
│   └── instances_test.json
```
- Supported formats: **CVAT for Images 1.1**, **Label Studio JSON-MIN**, **COCO Panoptic**.
