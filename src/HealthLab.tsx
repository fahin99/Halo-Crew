import { useMission } from "./mission-state"
import { lazy, Suspense, useEffect, useState } from "react"

const SpaceMaterial=lazy(()=>import("./SpaceMaterial"));

const devices = [
  {
    name: "Bioglove",
    sub: "Spot sensing · finger contact",
    signal: "Pulse / optical signal",
    purpose:
      "Finger-mounted optical sensor and wrist hub. Motion and contact quality gate every reading.",
    parts: [
      "Optical contact pad",
      "Wrist electronics hub",
      "Flexible cable channel",
    ],
    limits: "Does not measure immune function or bone density.",
  },
  {
    name: "Bioglass",
    sub: "Hands-free health interface",
    signal: "Prompts / acknowledgement",
    purpose:
      "Lightweight frame with a concept heads-up display for check-ins, instructions and alert acknowledgement.",
    parts: [
      "Transparent display concept",
      "Temple controller",
      "Audio / input concept",
    ],
    limits:
      "Display and audio are a concept; no working AR optics are claimed.",
  },
  {
    name: "ECG wearable",
    sub: "Chest-mounted signal input",
    signal: "Synthetic ECG replay",
    purpose:
      "A chest module with electrode connections. Demonstrates a future compatible ECG data interface.",
    parts: [
      "Chest processing module",
      "Electrode contacts",
      "Replaceable strap",
    ],
    limits: "This replay cannot diagnose or rule out cardiovascular events.",
  },
  {
    name: "Exercise sensor",
    sub: "Resistance equipment attachment",
    signal: "Load / repetition tracking",
    purpose:
      "A concept load-sensing attachment for resistance equipment. Tracks completion of a reviewed exercise plan.",
    parts: ["Load-cell mount", "Motion module", "Equipment clamp"],
    limits: "Exercise adherence is not a measurement of bone density.",
  },
  {name:"Bone-scan attachment",sub:"Periodic quantitative ultrasound",signal:"Acoustic acquisition / bone indicators",purpose:"A compact probe and positioning cradle for repeatable, site-specific ultrasound acquisition. The concept tracks acoustic measurements against an individual reference; it does not output a validated DXA-equivalent bone density.",parts:["Ultrasound probe","Acquisition electronics","Positioning cradle"],limits:"Research concept. Probe placement, coupling, calibration and clinical validation are required. Acoustic measurements are not interchangeable with DXA bone mineral density."},
  {name:"Pocket biomarker reader",sub:"Periodic saliva / small blood sample",signal:"Assay-specific biomarker result",purpose:"A reusable reader with a sealed disposable cartridge. Each cartridge targets a specified biomarker and supplies its own calibration and quality controls. Sample collection is distinct from onboard analysis.",parts:["Disposable sample cartridge","Optical reader","Sealed sample inlet"],limits:"Research concept. Selected biomarkers provide immune-related context, not a percentage of overall immune function. Consumables, sample handling and microgravity performance need validation."},

]
export function HardwareLab() {
  const mission = useMission()
  const scenario = mission.scenario
  const [selectedPart,setSelectedPart]=useState(0)
  const [device, setDevice] = useState(0),
    [spin, setSpin] = useState(true),
    [exploded, setExploded] = useState(false),
    [running, setRunning] = useState(true),
    [tick, setTick] = useState(0),
    [cinema, setCinema] = useState(false)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setTick((n) => n + 1), 650)
    return () => clearInterval(t)
  }, [running])
  const connected=mission.connections[device] === true
  const d = devices[device]
  const poor = scenario === "Poor contact"
  const hr = mission.signals.pulse
  const points = Array.from({ length: 100 }, (_, i) => {
    const p = (i + tick) % 25
    const y = device === 3 ? 95 - Math.max(0, Math.sin((i+tick)*.2))*65 : poor ? 70+Math.sin(i*4)*28 : device===0 ? 75-Math.pow(Math.max(0,Math.sin((i+tick)*.25)),3)*45 : 70+(p===12?-48:p===13?25:Math.sin(i*.5)*5);
    return `${i*6},${y}`
  }).join(" ")
  return (
    <div className={`page fade-in ${cinema ? "hardware-cinema" : ""}`}>
      <div className="page-head">
        <span className="eyebrow">HARDWARE STUDIO · CONCEPT PROTOTYPE</span>
        <div className="page-title">One crew. A compact health kit.</div>
        <p>
          Everyday wearables and periodic assessment modules connect to one personal health record. Explore each component and its sample data.
        </p>
      </div>
      <div className="lab-device-tabs">
        {devices.map((x, i) => (
          <button
            key={x.name}
            className={i === device ? "active" : ""}
            onClick={() => {setDevice(i);setSelectedPart(0)}}
          >
            {x.name}
            <small>{x.sub}</small>
            <span className={`device-connection ${mission.connections[i]?"is-connected":""}`}><i/>{mission.connections[i]?"Connected":"Not connected"}</span>
          </button>
        ))}
      </div>
      <div className="lab-layout">
        <section className="card model-stage">
          <div className="card-row">
            <span className="badge info">3D CONCEPT · NOT ENGINEERING CAD</span>
            <button
              className="btn secondary"
              onClick={() => setCinema(!cinema)}
            >
              {cinema ? "Exit presentation" : "Presentation view"}
            </button>
          </div>
          <Suspense fallback={<div className="material-placeholder"><i/><span/></div>}><SpaceMaterial kind="hardware" device={device} spin={spin} exploded={exploded} onSelect={part=>setSelectedPart(Number(part.split(":")[1])%3)}/></Suspense>
          <div className="lab-controls">
            <button className="btn secondary" onClick={() => setSpin(!spin)}>
              {spin ? "Pause rotation" : "Auto rotate"}
            </button>
            <button
              className="btn secondary"
              onClick={() => setExploded(!exploded)}
            >
              {exploded ? "Assembled view" : "Exploded view"}
            </button>
            <span>Drag to rotate</span>
          </div>
        </section>
        <section className="card">
          <span className="eyebrow">{d.sub}</span>
          <div className="card-title">{d.name}</div>
          <p>{d.purpose}</p>
          <div className="part-list">
            {d.parts.map((p, i) => (
              <button className={selectedPart===i?"active":""} onClick={()=>setSelectedPart(i)} key={p}>
                <b>0{i + 1}</b>
                {p}
              </button>
            ))}
          </div>
          <div className="component-focus"><small>SELECTED COMPONENT</small><strong>{d.parts[selectedPart]}</strong><p>{(device===4?["The ultrasound probe acquires acoustic signals at a repeatable assessment site; suitable coupling is required.","Acquisition electronics preserve the raw signal, calibration reference and acquisition quality.","The positioning cradle helps repeat the same site and orientation between assessments."]:device===5?["A sealed disposable cartridge contains an assay-specific sample path and reagents. Each test needs its own validated controls.","The optical reader converts the cartridge response using assay-specific calibration and attaches its quality-control result.","The sealed inlet supports controlled saliva or small-blood-sample handling with compatible consumables."]:["The contact or sensing interface brings observations into your personal health record.","The processing module connects a reading with its time, device and signal quality.","The supporting interface keeps the wearable usable during everyday mission routines."])[selectedPart]}</p></div>
          <details className="hardware-limit"><summary>Measurement boundaries</summary><p>{d.limits}</p></details>
          <span className={`badge ${connected?"info":"attention"}`}>{connected?"Connected":"Not connected"}</span>
        </section>
      </div>
      <section className="card simulation-panel">
        <div className="card-row">
          <div>
            <span className="eyebrow">
              {device===4 || device===5 ? "ILLUSTRATIVE PERIODIC ASSESSMENT" : device===1 ? "SAMPLE INTERFACE EVENTS" : `SYNTHETIC DATA · ${running ? "REPLAYING" : "PAUSED"}`}
            </span>
            <div className="card-title">{d.name} · data view</div>
          </div>
          {device < 4 && device !== 1 && (          <button
            className="btn secondary"
            onClick={() => setRunning(!running)}
          >
            {running ? "Pause replay" : "Resume replay"}
          </button>)}
        </div>
        {device < 4 && device !== 1 && <svg
          viewBox="0 0 600 140"
          className="signal-replay"
          role="img"
          aria-label={`${d.name} illustrative ${device===3?"load":device===0?"optical pulse":"ECG"} waveform`}
        >
          <polyline
            points={points}
            fill="none"
            stroke={poor ? "#e9b16d" : "#78d6ca"}
            strokeWidth="2"
          />
        </svg>}
        <div className="lab-readouts">{[
          [["Pulse",poor?"Recheck contact":`${hr} bpm`],["Optical quality",poor?"Insufficient":"Good"],["Oxygen saturation",poor?"Unavailable":`${mission.signals.oxygen}%`]],
          [["Latest prompt","Complete daily check-in"],["Acknowledgement","Recorded · 14:32"],["Input","Hands-free interface concept"]],
          [["Heart rate",poor?"Recheck contact":`${hr} bpm`],["Electrode contact",poor?"Insufficient":"Good"],["Acquisition","250 samples/s · illustrative"]],
          [["Resistance load","18 kgf"],["Repetitions","12"],["Session duration","35 min"]],
          [["Acoustic speed","3,500 m/s · illustrative"],["Assessment site","Tibial site · fixed reference"],["Acquisition quality","Sample acquisition accepted"]],
          [["Assay","CRP · blood cartridge concept"],["Concentration","1.2 mg/L · illustrative"],["Cartridge quality control","Sample control passed"]],
        ][device].map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
        <p className="soft-note">{device===4?"Raw acoustic indicator shown for interface illustration. Bone mineral density remains unmeasured; no clinical threshold or density conversion is applied.":device===5?"CRP is an inflammation-related biomarker, not a comprehensive immune-function test. Values illustrate the cartridge-to-record interface; no working assay is connected.":"Illustrative device records. Measurements retain their source, time, units and quality before entering the health record."}</p>
        <div className="device-data-route"><span>{d.name}</span><b>→</b><span>Controller / reader</span><b>→</b><span>Local mission hub</span><b>→</b><span>HALO health record</span></div>
      
      </section>
    </div>
  )
}
export function Roadmap() {
  return (
    <div className="page fade-in">
      <div className="page-head">
        <span className="eyebrow">WHAT’S NEXT</span>
        <div className="page-title">From concept to mission support.</div>
        <p>
          Our next steps: connected hardware, compact assessments and validated
          health support for longer missions.
        </p>
      </div>
      <div className="roadmap-sculpture"><div><span className="eyebrow">THE NEXT ORBIT</span><h2>Designed for today.<br/><em>Imagined for deep space.</em></h2><p>From a personal companion to a connected, suit-integrated ecosystem.</p></div><Suspense fallback={<div className="material-placeholder"><i/></div>}><SpaceMaterial kind="roadmap"/></Suspense></div>
      <div className="roadmap-grid">{[
        [
          "01 · Connected wearables",
          "Connect a physical controller and sensor stream, calibrate exercise load sensing, integrate compatible ECG input and evaluate signal quality.",
        ],
        [
          "02 · Compact periodic assessment",
          "Develop the quantitative-ultrasound attachment and sealed biomarker-cartridge reader. Validate repeatable probe placement, assay calibration, quality controls, storage, consumables and operation in microgravity. Bone acoustic indicators and selected immune-related biomarkers stay distinct from diagnostic conclusions.",
        ],
        [
          "03 · Validated decision support",
          "Evaluate sensor accuracy, baseline methods, clinical protocols, sample-result integrations, consent, encryption and offline synchronization with appropriate specialists.",
        ],
        [
          "04 · Suit-integrated ecosystem",
          "Modular sensors and hands-free prompts integrated into a suit concept. Validate comfort, power, reliability, cleaning, communications and mission suitability.",
        ],
        [
          "05 · Personalized forecasting",
          "Research and evaluate individual response models before making numerical 48-hour prediction or clinical confidence claims.",
        ],
      ].map(([t, p]) => (
        <section className="card roadmap-step" key={t}>
          <span className="roadmap-number">{t.split(" · ")[0]}</span>
          <div className="card-title">{t.split(" · ")[1]}</div>
          <p>{p}</p>
        </section>
      ))}</div>
    </div>
  )
}
