# BilletVision: Hardware Integration Guide

## 1. Modular Fieldbus & HAL Architecture
BilletVision is architected so that industrial hardware can be integrated on-site without rewriting pipeline logic.

All hardware drivers extend the abstract interfaces defined in `backend/hardware/interfaces.py`:

```
┌─────────────────────────────────────────────────────────────┐
│                 Hardware Abstraction Layer                  │
├──────────────────┬──────────────────────┬───────────────────┤
│ Interface        │ Demo / Prototype     │ Industrial Bridge │
├──────────────────┼──────────────────────┼───────────────────┤
│ CameraInterface  │ DemoCameraProvider   │ Basler / FLIR GigE│
│ EncoderInterface │ DemoEncoder          │ Beckhoff EtherCAT │
│ Laser3DInterface │ DemoLaser3D          │ Keyence LJ-X8000  │
│ ECAInterface     │ DemoECA              │ Olympus OmniScan  │
│ PAUTInterface    │ DemoPAUT             │ Olympus / Zetec   │
│ PLCInterface     │ DemoPLC              │ Siemens S7 OPC-UA │
└──────────────────┴──────────────────────┴───────────────────┘
```

---

## 2. Industrial PLC & Reject Actuator Interface
The PLC layer interacts with plant automation via OPC-UA (port 4840) or Modbus TCP (port 502):

### Discrete Registers:
- `CONVEYOR_RUNNING` (Bit 0): Interlock status.
- `BILLET_PRESENT` (Bit 1): Entry photo-eye.
- `INSPECTION_READY` (Bit 2): Optical acquisition ready.
- `INSPECTION_COMPLETE` (Bit 3): Decision finalized.
- `REJECT_REQUEST` (Bit 4): Pneumatic diverter trigger.
- `REJECT_CONFIRMED` (Bit 5): Reject gate feedback.
- `EMERGENCY_STOP` (Bit 6): Line safety interlock.
