# BilletVision: Phased Array Ultrasonic Testing (PAUT) Integration

## 1. Principles of PAUT Volumetric Inspection
Phased Array Ultrasonic Testing (PAUT) emits high-frequency acoustic wave packets (typically 5.0 MHz) through multiple piezoelectric elements with electronic time delays (phasing).

### Target Defects in Steel Billets:
1. **Central Shrinkage Cavities / Core Piping**: Formed during continuous casting solidification.
2. **Volumetric Inclusions**: Macro-inclusions trapped in the core.
3. **Internal Core Porosity**: Gas bubbles or inter-dendritic pores.

---

## 2. Hardware Abstraction Interface

```python
class PAUTInterface(abc.ABC):
    @abc.abstractmethod
    def acquire_volumetric_slice(self, encoder_pos_mm: float) -> Dict[str, Any]:
        """Returns A-scan waveform, B-scan cross section depth (0-150mm), and peak reflection %."""
        pass

    @abc.abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns pulser-receiver state, acoustic coupling, and sound velocity calibration."""
        pass
```

---

## 3. Prototype Acoustic Simulation (`DemoPAUT`)
In the prototype environment, `DemoPAUT` computes:
- **Sound Velocity**: 5920.0 m/s (longitudinal wave speed in carbon steel).
- **Nominal Section Depth**: 150.0 mm.
- **DAC Rejection Threshold**: 40.0% echo amplitude.
- **A-Scan Samples**: Frontwall echo @ 0 mm, Internal indication @ 75 mm, Backwall echo @ 150 mm.

> **HONESTY NOTICE**: The UI and API explicitly tag all prototype PAUT streams as:
> `PAUT MODE: SIMULATION`

---

## 4. Planned Industrial Hardware Adapters
Physical PAUT integration targets Olympus OmniScan PAUT, Sonatest Veo+, or Zetec Topaz instruments via high-speed GigE / PCIe acoustic streaming cards.
