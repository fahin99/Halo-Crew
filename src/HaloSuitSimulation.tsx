import { lazy, Suspense, useState } from "react"
import { scenarios, useMission, type Scenario } from "./mission-state"

const SpaceMaterial = lazy(() => import("./SpaceMaterial"))
const modules = [
  {name:"Bioglove",location:"Hands & wrist",detail:"Optical pulse sensing woven into the glove, with contact quality checked before a reading is used.",metric:"Pulse · oxygen estimates",mode:"Continuous sensing"},
  {name:"Bioglass",location:"Visor interface",detail:"A hands-free display concept brings a check-in, a prompt or the next action into view.",metric:"Prompts · acknowledgement",mode:"Hands-free interface"},
  {name:"ECG module",location:"Chest layer",detail:"Chest contacts and a compact recording module form the suit’s proposed ECG interface.",metric:"Electrical heart signal",mode:"Continuous sensing"},
  {name:"Movement module",location:"Joints & sleeves",detail:"Motion sensors follow movement and exercise routines. Resistance load still needs the compatible equipment attachment.",metric:"Movement · exercise context",mode:"Continuous sensing"},
  {name:"Bone assessment",location:"Lower-leg attachment",detail:"A dockable ultrasound probe supports periodic acoustic assessment. It requires positioning and calibration; bone density is not inferred here.",metric:"Acoustic assessment record",mode:"Periodic assessment"},
  {name:"Biomarker reader",location:"Waist service dock",detail:"A suit-carried reader accepts a sealed sample cartridge. Selected laboratory markers need a collected sample and their own quality controls.",metric:"Assay-specific sample result",mode:"Periodic assessment"},
]

export default function HaloSuitSimulation({compact=false,onInsights}:{compact?:boolean;onInsights?:()=>void}) {
  const m = useMission()
  const [selected,setSelected] = useState(2)
  const [rotate,setRotate] = useState(false)
  const [expanded,setExpanded] = useState(false)
  const tick=m.simulationTick, poor=m.signals.quality==="Unreliable"
  const active=modules[selected]
  const wave=Array.from({length:110},(_,i)=>{
    const phase=(i+tick*3)%27
    const y=poor?48+Math.sin(i*2.6+tick)*17:48+(phase===11?-5:phase===12?-30:phase===13?19:phase===14?-7:Math.sin((i+tick)*.3)*2)
    return `${i*5},${y}`
  }).join(" ")
  const cards=[
    {label:"Heart rate",value:m.signals.pulse,unit:"bpm",source:"Glove optical module"},
    {label:"Oxygen estimate",value:m.signals.oxygen,unit:"%",source:"Glove optical module"},
    {label:"Temperature",value:m.signals.temperature,unit:"°C",source:"Suit contact sensor"},
    {label:"Heart rate variability",value:m.signals.hrv,unit:"ms",source:"Derived from pulse intervals"},
  ]
  return <section className={`halosuit-simulation ${compact?"suit-compact":""} ${expanded?"suit-presentation":""}`} aria-label="HaloSuit integrated wearable simulation">
    <div className="suit-section-heading"><div><span className="eyebrow">HALOCREW HARDWARE EXTENSION</span><h2>Meet HaloSuit.</h2><p>Wearable sensing, woven into your mission.</p></div><span className={`suit-status ${m.suitStreaming?"streaming":""}`}><i/>{m.suitStreaming?"Simulation running":tick>0?"Simulation paused":"Simulation ready"}</span></div>
    <div className="suit-console">
      <div className="suit-visual">
        <div className="suit-visual-top"><span>HALOSUIT / 01</span><span>INTEGRATED CONCEPT</span></div>
        <Suspense fallback={<div className="material-placeholder"><i/><span/></div>}><SpaceMaterial kind="suit" spin={rotate} onSelect={id=>{const n=Number(id.split(":")[1]);if(n>=0&&n<6)setSelected(n)}}/></Suspense>
        <div className="suit-module-list" aria-label="Integrated modules">{modules.map((module,i)=><button key={module.name} className={selected===i?"active":""} aria-pressed={selected===i} onClick={()=>setSelected(i)}><span>0{i+1}</span>{module.name}<i/></button>)}</div>
        <div className="suit-visual-bottom"><span>DRAG TO ROTATE · SELECT A MODULE</span><button onClick={()=>setRotate(v=>!v)} aria-label={rotate?"Pause suit rotation":"Rotate suit"}>{rotate?"Pause rotation":"Rotate suit"}</button></div>
      </div>
      <div className="suit-telemetry">
        <div className="suit-telemetry-title"><div><span className="eyebrow">HALOSUIT → HALOCREW</span><h3>Your signals, together.</h3></div><span className="suit-synthetic">SIMULATED DATA</span></div>
        <div className="suit-metrics">{cards.map(card=><div key={card.label}><small>{card.label}</small><strong>{card.value??"—"}<span>{card.unit}</span></strong><p>{card.value===null?"Withheld · recheck contact":card.source}</p></div>)}</div>
        <div className={`suit-wave ${poor?"poor-contact":""}`}><div><span>{poor?"CONTACT CHECK NEEDED":"ILLUSTRATIVE ECG STREAM"}</span><small>{m.suitStreaming?`Packet ${String(tick).padStart(4,"0")} · updating each second`:"Stream paused"}</small></div><svg viewBox="0 0 550 90" role="img" aria-label="Simulated electrical heart signal"><path d="M0 25H550M0 50H550M0 75H550" stroke="#dac0ed16"/><polyline points={wave} fill="none" stroke={poor?"#e4ad83":"#a7e3ce"} strokeWidth="2"/></svg></div>
        <div className="suit-module-detail"><span className="eyebrow">{active.location} / {active.mode}</span><h4>{active.name}</h4><p>{active.detail}</p><small>{active.metric}</small></div>
        <div className="suit-simulation-controls"><button className="btn primary" onClick={()=>m.setSuitStreaming(!m.suitStreaming)}>{m.suitStreaming?"Pause simulation":tick>0?"Resume simulation":"Start suit simulation"}<span aria-hidden="true">{m.suitStreaming?"Ⅱ":"▷"}</span></button><label>Mission scenario<select value={m.scenario} onChange={e=>m.setScenario(e.target.value as Scenario)}>{scenarios.map(s=><option key={s}>{s}</option>)}</select></label></div>
      </div>
    </div>
    <div className="suit-summary"><div><i/><span>{m.notice.title}</span><p>{m.notice.action}</p></div>{onInsights&&<button className="btn secondary" onClick={onInsights}>Understand my signals ↗</button>}<button className="suit-expand" onClick={()=>setExpanded(v=>!v)}>{expanded?"Exit presentation":"Presentation view"}</button></div>
    <p className="suit-boundary">Interactive concept with synthetic readings. Continuous sensors and periodic sample assessments share one suit system; no physical device is connected.</p>
  </section>
}
