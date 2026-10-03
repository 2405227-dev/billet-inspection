# Billet Defect Dataset Annotation & Format Guide

---

## 🏷️ Annotation Classes & Ontology

| Class Name | Defect Code | Physical Description | Metallurgical Severity |
|---|---|---|---|
| `longitudinal_crack` | `DEF_LC` | Axial fissure along casting direction | `MAJOR` / `CRITICAL` (&gt;50mm) |
| `transverse_crack` | `DEF_TC` | Perpendicular fracture across billet face | `CRITICAL` (&gt;25mm) |
| `corner_crack` | `DEF_CC` | Fissure initiating along corner chamfer | `CRITICAL` (&gt;30mm) |
| `hairline_crack` | `DEF_HC` | Sub-millimeter crack &lt; 5mm in length | `MINOR` |
| `scab` | `DEF_SC` | Splashed metal patch adhering to surface | `MAJOR` |
| `lap` | `DEF_LP` | Folded metal seam from rolling pass | `MAJOR` |
| `seam` | `DEF_SM` | Straight longitudinal line flaw | `MAJOR` |
| `scale_pit` | `DEF_SP` | Depression left by rolled-in mill scale | `MODERATE` |

---

## 📁 Annotation Tool Workflows

- **CVAT**: Use Polygon / Polyline tool for fine cracks. Set label attributes `severity` and `surface_face`.
- **Label Studio**: Export in `JSON-MIN` or `COCO` segmentation format.
- Export annotations directly into `dataset/annotations/` and run `ml/train_defect_detector.py`.
