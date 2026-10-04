# BilletVision: Eddy Current Array (ECA) Integration

## 1. Principles of ECA in Steel Billet Inspection
Eddy Current Array (ECA) utilizes electromagnetic induction with a multi-element coil array to detect surface and near-surface cracks in conductive steel billets.

### Key Advantages over Optical Vision:
1. **Scale Penetration**: Detects cracks concealed beneath non-conductive oxide mill scale.
2. **Tight Hairline Cracks**: Detects closed cracks that reflect minimal optical light.
3. **Phase Discrimination**: Phase angle ($\theta$) separates lift-off distance from true material discontinuities.

---

## 2. Hardware Abstraction Interface

```python
class ECAInterface(abc.ABC):
    @abc.abstractmethod
    def acquire_scan_slice(self, encoder_pos_mm: float) -> Dict[str, Any]:
        """Returns 16-channel impedance readings (amplitude mV, phase deg) at encoder coordinate."""
        pass

    @abc.abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns excitation frequency, channel count, and connection health."""
        pass
```

---

## 3. Prototype Simulation (`DemoECA`)
In the prototype environment, `DemoECA` models:
- **16 Array Channels** across the 150 mm billet surface width.
- **Probe Frequency**: 250.0 kHz.
- **Flaw Threshold**: 120.0 mV amplitude.
- **Phase Angle**: 88.5° for open tight cracks vs 45.0° baseline noise.

> **HONESTY NOTICE**: The UI and API explicitly tag all prototype ECA streams as:
> `ECA MODE: SIMULATION`

---

## 4. Industrial Field Integration
To deploy with physical hardware (e.g. Olympus/Evident OmniScan ECA or Eddyfi Ectane):
1. Install vendor C++/Python acquisition SDK.
2. Implement `IndustrialECAAdapter` wrapping device driver stream.
3. Replace adapter injection in `backend/hardware/adapters/` without altering core orchestrator logic.
