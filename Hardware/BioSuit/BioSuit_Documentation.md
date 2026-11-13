# HaloCrew BioSuit — engineering concept

BioSuit is a proposed intravehicular biomedical monitoring garment. The files
contain actual CAD solids and modeled electronics, contacts and accessories.
They do not demonstrate a functioning medical device or a flight-qualified suit.
This is not an EVA pressure suit, oxygen supply, radiation shield or life-support system.

## Files and first use

1. Open **HaloCrew_BioSuit_Complete.FCStd** in FreeCAD. The assembled suit is the default view.
2. Expand **HALOCREW / BIOSUIT** to select sensor assemblies and individual components.
3. Select a component to read **IntendedFunction**, **MountLocation**, and **MeasurementLimit** in the Data property panel.
4. Open the **Parameters** spreadsheet to change dimensions. Recompute after editing.
5. Use **HaloCrew_BioSuit_Views.FCMacro** through Macro → Macros → Execute to switch
   between complete, exploded, transparent, annotations, front, back, ECU cutaway,
   accessories and an optional camera orbit. Switching views changes visibility,
   transparency and camera settings; it does not move source geometry.
6. Use normal FreeCAD mouse navigation to inspect all sides. Choose your preferred
   navigation style in Preferences. Press V then F to fit the active view.

The STEP file exchanges CAD solids. It does not preserve the full parametric
construction history or the saved FreeCAD visualization modes. The GLB is a
named-component visualization mesh in meters with Y-up axes; it is useful in a
web renderer but is not the editable CAD source. PNGs are presentation images
rendered from the actual CAD tessellation. The CSV lists physical components and
their intended roles. The JSON validation report records the executed checks.

## Model construction and editability

The native file uses a parameter spreadsheet, elliptical section profiles,
solid lofts, hollowing cuts, cylinders, ellipsoids, boxes and native compound
component objects that retain sensor metadata on reopening. There are no
external FeaturePython proxies to restore, and opening the file does not require
the generation macro. Expand **Construction_Geometry** to find hidden source
profiles and primitive dimensions. These are intentionally excluded from exports.
Exploded views use native links to the original components. Sensor callouts are
native annotations and selectable arrow curves; they are not STEP solids.

The global body-height parameter scales placements and most geometry around a
1750 mm reference. Chest and waist parameters control the corresponding torso
sections. Arm and leg lengths control the garment limb sections. Electrode
spacing controls selected EMG pairs. Sensor size controls local sensor enclosure
dimensions. ECU and battery dimensions have independent parameters. Garment
and protective-panel thicknesses are separate parameters.

**Resizing limits:** this is a simplified anatomical concept, not a body-scan
tailoring system. Chest/waist circumferences are proportional ellipse scale
controls rather than exact solved perimeters. Changing independent limb lengths,
circumferences or module sizes requires checking sensor contact, cable routes,
panel positions and internal-board fit manually. Global height scaling keeps the
main arrangement proportional; independent sizing does not automatically refit
every sensor or accessory. Use moderate edits and inspect geometry afterward.
Fabric flexibility is represented by thin hollow surfaces and joint bands;
textile deformation, articulated kinematics and tissue compression are not simulated.
Joint bands represent compliant regions; there are no solved mechanical joints.
Glove finger profiles are simplified and are not individual subject scans.

## Hardware and supported measurements

| Assembly | Physical items represented | Intended output / limit |
|---|---|---|
| Cardiovascular | Ten modified torso ECG contacts, snaps, AFE board; wrist PPG emitters, barrier and photodiode | ECG/rhythm, HR/HRV and peripheral pulse trends; modified lead locations require validation |
| Respiratory | Thoracic and abdominal conductive stretch bands; independent impedance contacts/readout | Movement/rate/pattern and respiratory impedance; neither band directly measures SpO2 or end-tidal CO2 |
| Temperature | Contact packages at chest, upper back, arm and thigh; exposed ambient sensor | Local skin and ambient temperature; no direct core-temperature measurement from cloth |
| Surface EMG | Bilateral biceps, forearm, quadriceps, hamstrings, calf and back contact pairs and acquisition boards | Local muscle activation trends; motion artifact and crosstalk must be controlled |
| Motion | Chest, pelvis and bilateral upper-arm, forearm, thigh and shank IMUs; elbow, knee, hip and wrist flex strips | Segment orientation, activity and joint movement after calibration/fusion |
| Sweat | Replaceable cartridge, collection inlet, modeled channels, three electrode regions and reader | Exploratory local Na+/Cl- monitoring; blood electrolytes and total hydration are not established |
| Autonomic | Wrist/palm EDA plus existing ECG, respiration, temperature and motion channels | Physiological stress-associated trends; no emotion reading, depression diagnosis or cortisol assay |
| Dosimetry | Detector volume, enclosure, EMI shielding region, clip and electronics | Calibrated personal exposure logging; no cellular-damage measurement |
| Environment | Exposed vented pod with temperature/RH, pressure, NDIR CO2 and optional O2 packages | Local ambient samples; representativeness of cabin air must be established |
| Gloves | Five fingers, optical SpO2/PPG packages, contact temperature, EDA, hand IMU, five flex strips, contact pressure and wrist electronics | Peripheral oxygen/pulse trends and hand movement/contact force; contact/perfusion/motion quality matter |
| Insoles | Removable plates, eight pressure zones per foot and acquisition boards | Contact force during exercise or restraint/surface contact; no weight inference in free-floating microgravity |
| VisionGuard | Rims, lenses, near-eye display, inward IR camera barrels/PCBs, illumination housings, IMU, processor/battery and tether | Pupil/blink/eye motion and visual-testing concept; no SANS diagnosis or replacement for OCT/retinal imaging |
| ECU / power | Processor, MCU, biopotential, IMU and optical boards; radio, storage, synchronization, power distribution, BMS, protected cell concepts, keyed sockets and service lids | Packaging for synchronized acquisition and onboard analytics; no deployed firmware or clinical algorithm supplied |

Skin-contact electrodes are placed at the inner garment surface. Some are
intentionally concealed in the assembled view. The transparent view exposes
these parts. Front protective plates, flex bands, wrist interfaces, snap
contacts, keyed connectors and cable strain relief are separate geometry.
Boards and chips represent package envelopes; they are not PCB schematics or
manufacturing layouts. Cable runs are flexible-routing concepts made of short
native cylinder segments and bend spheres; they are not resolved cable drawings.

## Separate medical accessories

The accessory assembly is hidden in the default suit view and can be inspected
independently. The STEP file includes it as a separate off-body rack.

- **Blood pressure:** hollow inflatable cuff envelope, closure, pneumatic line,
  pump/display instrument enclosure and acquisition electronics. Ordinary ECG
  and PPG do not establish clinically accurate cuffless blood pressure.
- **Capnography:** separate sample-cell enclosure, sample tubing and cannula
  geometry. This is different from the local ambient CO2 package.
- **Core temperature:** optional telemetric capsule housing and separate
  receiver concept. Clinical selection and use need an appropriate protocol.
- **Sleep studies:** optional six EEG/EOG contacts, harness and amplifier.
  Basic wearable trends and this accessory are not demonstrated to be equivalent
  to polysomnography.
- **Ocular diagnostic docking:** plate, locating pins and data/power port only.
  A functional OCT, fundoscope, tonometer or ultrasound system is **not** included.
  These are separate diagnostic instruments with substantial optical and clinical
  requirements. Eyewear illumination is not certified eye-safe by its CAD housing.

## Intended data workflow

1. Sensors produce raw signals with timestamps and hardware/channel IDs.
2. Acquisition applies analog filtering, safe excitation where relevant and digitization.
3. Artifact reduction uses contact, motion and channel context.
4. Signal-quality assessment marks missing, corrupted or low-confidence windows.
5. Feature extraction derives only measurements supported by the channels above.
6. Personal-baseline comparison accounts for exercise, sleep and operating context.
7. Time-series anomaly detection flags sustained changes and reports uncertainty.
8. Multimodal analytics aggregates evidence without inventing direct diagnoses.
9. The astronaut dashboard displays trends, signal quality and supporting channels.
10. Alerts trigger medical review and, where appropriate, separate diagnostic testing.

This document specifies an intended architecture; executable acquisition,
signal processing, anomaly models and dashboard software are not delivered here.

## Engineering assumptions and validation

Dimensions are concept estimates for an adult reference. Wall thickness is
nominally 1.5 mm textile and 2 mm protective panels, with locally thicker cuff,
boot and enclosure geometry. Contacts, seams, snaps, harness bends and layered
PCBs have intentional local overlaps. The boot soles are closed by the removable
insole plates. A simplified reference head is visible; torso/limb reference
ellipsoids are hidden. This is not a watertight single manufacturing part: it is
an assembly of independently inspectable solids.

The build checks all final component solids for non-null, valid shapes. The saved
file is reopened/recomputed. All fifteen spreadsheet parameters are exercised
and restored. Selected ECU/battery/panel/glove enclosure-to-garment pairs are
checked for intersecting volume. STEP is reimported and validated. GLB is reopened
and its named component count compared. Camera orientations through a full orbit
are exercised. Details and exact counts are in **BioSuit_Validation.json**.

These checks do not constitute an exhaustive interference study, actual-body
fit test, medical validation, radiation calibration, EMC evaluation, optical
safety assessment, material qualification, thermal analysis or electrical
safety certification. No power budget, battery endurance, mass estimate, RF
approval or flight acceptance is claimed. Native dimensions are editable;
concept packaging is not a manufacturing-ready design.

## Regeneration

Execute **HaloCrew_BioSuit_Generator.FCMacro** in FreeCAD GUI. It saves the native
file, STEP, component CSV, validation summary and render-geometry JSON. By default
output is `~/HaloCrew_BioSuit`; set the `BIOSUIT_OUTPUT` environment variable to
choose another directory. The macro creates a fresh document with the default
parameters; to retain a custom size, edit the defaults at the start of the macro
or edit and save the native model afterward.

For PNGs and GLB, run **BioSuit_Render_And_Export.py** in the same output directory
using Python with numpy, numba, Pillow and trimesh. It renders tessellated CAD
surfaces with an orthographic CPU depth-buffer renderer. It does not generate
imaginary geometry. Images are presentation renders rather than certified
engineering drawings. A saved-geometry snapshot is included for reproduction.

## Technical reference grounding

NASA documents SANS as a collection of structural ocular changes and lists
clinical assessment hardware including vision screening, fundoscope, OCT,
ultrasound and tonometry. Eye-tracking eyewear is therefore treated here as a
monitoring/testing interface rather than a structural diagnostic substitute.
NASA also describes garment-based physiological monitoring concepts, which
support the general architecture without validating this particular proposal.

- NASA: [Risk of Spaceflight Associated Neuro-ocular Syndrome](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/)
- NASA NTRS: [SANS: 2023 Clinical Update](https://ntrs.nasa.gov/citations/20220014606)
- NASA: [ISS Research Keeps an Eye on Vision Changes in Space](https://www.nasa.gov/humans-in-space/international-space-station-research-keeps-an-eye-on-vision-changes-in-space/)
- NASA NTRS: [Lunar Health Monitor](https://ntrs.nasa.gov/citations/20160005394)

These references ground the separation of monitoring and diagnosis; they do not
endorse HaloCrew or provide validation of the modeled devices.
