# BilletVision: Rotary Encoder & Physical Position Synchronization

## 1. Why Encoder Synchronization is Critical
In continuous industrial rolling lines, billets travel continuously on conveyor tables at speeds between 500 mm/s and 1500 mm/s.

Using video frame numbers alone as physical coordinates causes severe positional errors due to:
- Frame jitter and variable camera exposure time.
- Conveyor speed variations or roller slippage.
- Sensor spatial offsets between optical camera, 3D laser, ECA probe, and PAUT wedge.

BilletVision binds every sensor event directly to instantaneous **millimeter encoder coordinates**.

```
   Optical Camera (CAM-01)          ECA Array Station         PAUT Probe Station
           [ 0 mm ]                     [ +650 mm ]               [ +1250 mm ]
              │                              │                         │
              ▼                              ▼                         ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │ ░░░░░░░░░░░░░░░░░░░░░░ STEEL BILLET (6000 mm) ░░░░░░░░░░░░░░░░░░░░░░░░│
   └────────────────────────────────────────────────────────────────────────┘
                                    ════════
                          [ Rotary Pulse Encoder ]
```

---

## 2. Encoder Abstraction (`EncoderInterface`)

```python
class EncoderInterface(abc.ABC):
    @abc.abstractmethod
    def get_position_mm(self) -> float:
        """Returns physical line position in millimeters."""
        pass

    @abc.abstractmethod
    def get_velocity_mm_s(self) -> float:
        """Returns instantaneous conveyor line speed in mm/s."""
        pass
```

---

## 3. Spatial Cross-Correlation
When an optical defect is detected at $x_{pixel}$ in the camera frame:
$$x_{physical} = \text{EncoderPosition}_{entry} + \left(\frac{x_{pixel}}{W_{image}}\right) \times L_{FOV}$$

The same physical coordinate is then cross-queried in the ECA multi-channel array and PAUT acoustic volume.
