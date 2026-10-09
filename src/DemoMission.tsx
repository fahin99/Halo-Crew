import { loadConversations, requestReply } from "./backend-client"
import { sampleHistory } from "./sample-history"
import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { scenarios, useMission, type Scenario } from "./mission-state"

const SpaceMaterial=lazy(()=>import("./SpaceMaterial"));
const MaterialPlaceholder=()=> <div className="material-placeholder" aria-hidden="true"><i/><span/></div>;

const Head = ({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) => (
  <div className="page-head">
    <span className="eyebrow">{eyebrow}</span>
    <div className="page-title">{title}</div>
    <p>{children}</p>
  </div>
)
const Panel = ({
  title,
  children,
  className = "",
}: {
  title: string
  children: React.ReactNode
  className?: string
}) => (
  <section className={`card mission-panel ${className}`}>
    <div className="card-title">{title}</div>
    {children}
  </section>
)
export function DemoControls() {
  const m = useMission()
  return (
    <div className="mission-sample-controls">
      <span>
        <i />
        SIMULATED MISSION
      </span>
      <label>
        Scenario
        <select
          aria-label="Mission scenario"
          value={m.scenario}
          onChange={(e) => m.setScenario(e.target.value as Scenario)}
        >
          {scenarios.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <button
        onClick={() => m.setOffline(!m.offline)}
        className="btn secondary"
      >
        {m.offline ? "Offline mode" : "Local record"}
      </button>
      <small>No medical hardware connected</small>
      {m.storageError && (
        <strong>
          Browser storage unavailable: changes may not survive reload.
        </strong>
      )}
    </div>
  )
}
const domains = [
  {
    name: "Cardiovascular",
    indicator: "Pulse, HRV, ECG, BP and symptoms",
    source: "Bioglove / compatible ECG / periodic BP",
    gap: "ECG and BP are not connected",
    action: "Review cardiovascular signals",
    scenario: "Recovery shift",
  },
  {
    name: "Immune health",
    indicator: "Temperature, symptoms and sample results",
    source: "Pocket biomarker reader / temperature / sample record",
    gap: "Assay-specific evidence; overall immune function is not inferred",
    action: "Request medical review",
    scenario: "Immune review",
  },
  {
    name: "Bone & muscle",
    indicator: "Resistance sessions, load and clinical tests",
    source: "Exercise sensor / compact ultrasound attachment / scan history",
    gap: "Acoustic indicators require calibration; bone density is unmeasured",
    action: "Review exercise plan",
    scenario: "Exercise gap",
  },
  {
    name: "Behavioral health",
    indicator: "Mood, fatigue, loneliness and sleep",
    source: "Private self-report / sleep history",
    gap: "No diagnostic behavioral assessment",
    action: "Choose private support",
    scenario: "Recovery shift",
  },
  {
    name: "Sleep & circadian rhythm",
    indicator: "Sleep duration, quality and schedule",
    source: "Training reference / synthetic sleep log",
    gap: "No validated sleep staging",
    action: "Plan a wind-down",
    scenario: "Recovery shift",
  },
  {
    name: "Nutrition & hydration",
    indicator: "Intake, symptoms and prescribed plan",
    source: "Self-report / clinician-reviewed plan",
    gap: "No hydration or nutrition test result",
    action: "Record intake and symptoms",
    scenario: "Nominal",
  },
  {
    name: "Radiation exposure",
    indicator: "Dose, dose rate and exposure history",
    source: "External dosimeter integration",
    gap: "No dosimeter connected",
    action: "Request exposure review",
    scenario: "Nominal",
  },
  {
    name: "Habitat & respiratory",
    indicator: "Cabin CO₂, air conditions and symptoms",
    source: "Synthetic habitat stream / spot SpO₂",
    gap: "Cabin safety requires mission protocols",
    action: "Request habitat review",
    scenario: "Habitat alert",
  },
  {
    name: "Vision & sensorimotor",
    indicator: "Vision changes, balance and difficulty",
    source: "Self-report / approved assessment",
    gap: "No ocular imaging or balance test",
    action: "Request specialist assessment",
    scenario: "Nominal",
  },
  {
    name: "Pain, injury & other symptoms",
    indicator: "Location, severity, onset and history",
    source: "Daily check-in / medical assessment",
    gap: "Symptoms need appropriate evaluation",
    action: "Open care review",
    scenario: "Nominal",
  },
]
export function DemoHome({ go }: { go: (p: any,domain?:number) => void }) {
  const m = useMission()
  const v = m.signals
  const [motion,setMotion]=useState(true)
  return (
    <div className="page fade-in">
      <Head eyebrow="ARES III · MISSION DAY 147" title="Good morning, Maya.">
        Your next action comes first. HALO connects body signals, mission
        context and your own check-ins.
      </Head>
      <section className={`card status-hero ${m.notice.tone}`}>
        <div>
          <span className={`badge ${m.notice.tone}`}>
            {m.notice.tone === "good"
              ? "AVAILABLE SIGNALS NEAR REFERENCE"
              : "REVIEW RECOMMENDED"}
          </span>
          <h1>{m.notice.title}</h1>
          <p>{m.notice.body}</p>
          <div className="lab-controls">
            <button
              className="btn primary"
              onClick={() => {
                if(m.scenario==="Poor contact"){m.log("Signal recheck","Presenter replayed a sensor-contact recheck; synthetic contact restored. No physical reading taken.");m.setScenario("Nominal");return;}
                go(m.checkin.pain==="Severe" || m.scenario==="Immune review"?"medical":m.scenario==="Recovery shift" || m.scenario==="Exercise gap" || m.notice.action.includes("support")?"support":"health",m.scenario==="Habitat alert"?7:0);
              }}
            >
              {m.notice.action} →
            </button>
            <button className="btn secondary" onClick={() => go("insights")}>
              See the evidence
            </button>
          </div>
        </div>
        <div className="halo-art">
          <span className="art-coordinate">HALO / PERSONAL ORBIT</span>
          <Suspense fallback={<MaterialPlaceholder/>}><SpaceMaterial spin={motion}/></Suspense>
          <div className="halo-index"><strong>{m.scores.load}</strong><div><span>SUPPORT INDEX</span><small>Illustrative · not a clinical score</small></div></div>
          <button className="art-motion" aria-label={motion?"Pause HALO motion":"Resume HALO motion"} onClick={()=>setMotion(!motion)}>{motion?"Ⅱ":"▷"}</button>
        </div>
      </section>
      <div className="live-metric-grid">
        {[
          [
            "Resting pulse",
            v.pulse === null ? "—" : `${v.pulse} bpm`,
            "Training reference 64 ± 5 bpm",
          ],
          [
            "HRV",
            v.hrv === null ? "—" : `${v.hrv} ms`,
            "Training reference 48 ± 8 ms",
          ],
          ["Sleep", `${v.sleep} h`, "Sample target 8 h"],
          [
            "Oxygen",
            v.oxygen === null ? "—" : `${v.oxygen}%`,
            "Synthetic spot reading",
          ],
        ].map(([a, b, c], i) => (
          <section className="card" key={a}>
            <small>{a}</small>
            <strong>{b}</strong>
            <p>{c}</p>
            <span
              className={`badge ${
                i === 2 || v.quality === "Good" ? "info" : "attention"
              }`}
            >
              {i === 2 || v.quality === "Good"
                ? "Synthetic input"
                : "Contact unreliable"}
            </span>
          </section>
        ))}
      </div>
      <div className="section-title-row">
        <div>
          <span className="eyebrow">YOUR HEALTH LANDSCAPE</span>
          <div className="section-title">More than four risks.</div>
        </div>
        <button className="btn ghost" onClick={() => go("health")}>
          Explore all domains →
        </button>
      </div>
      <div className="health-domains">
        {domains.slice(0, 5).map((d, i) => (
          <button key={d.name} onClick={() => go("health",i)}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <strong>{d.name}</strong>
            <small>{d.indicator}</small>
            <b>
              {i === 2
                ? `${m.scores.adherence}% plan adherence`
                : i === 1
                  ? "Test evidence needed"
                  : "View evidence"}
            </b>
          </button>
        ))}
      </div>
      <div className="two-col">
        <Panel title="A moment for you">
          <p>
            Your latest check-in: {m.checkin.mood}, fatigue {m.checkin.fatigue}
            /10.
          </p>
          <div className="lab-controls">
            <button className="btn secondary" onClick={() => go("health")}>
              Daily check-in
            </button>
            <button className="btn secondary" onClick={() => go("family")}>
              Connect with home
            </button>
          </div>
        </Panel>
        <Panel title="Action history">
          <p>
            {m.logs[0]?.text ||
              "No actions logged yet. Start a check-in or support session."}
          </p>
          <button className="btn ghost" onClick={() => go("support")}>
            Follow up on an action →
          </button>
        </Panel>
      </div>
    </div>
  )
}
export function Checkin() {
  const m = useMission()
  const [form, setForm] = useState(m.checkin)
  const [saved, setSaved] = useState(false)
  return (
    <Panel title="30-second daily check-in" className="compact-checkin">
      <div className="checkin-layout"><div className="checkin-sculpture" aria-hidden="true"><div className={`mood-pearl mood-${form.mood.toLowerCase()}`}><i/><b/><span/></div><span className="checkin-orbit"/><small>A MOMENT FOR YOU</small><strong>{form.mood}</strong></div><div className="checkin-fields">
      <p>
        How are you feeling? Add the context only you can provide.
      </p>
      <div className="metric-pills">
        {["Calm", "Focused", "Tired", "Stressed", "Low"].map((x) => (
          <button
            className={form.mood === x ? "active" : ""}
            key={x}
            onClick={() => {
              setForm({ ...form, mood: x })
              setSaved(false)
            }}
          >
            {x}
          </button>
        ))}
      </div>
      <label className="fatigue-control">
        Fatigue {form.fatigue}/10
        <input
          type="range"
          min="0"
          max="10"
          value={form.fatigue}
          onChange={(e) => {
            setForm({ ...form, fatigue: +e.target.value })
            setSaved(false)
          }}
        />
      </label>
      <div className="form-grid">
        <label>
          Pain / discomfort
          <select
            value={form.pain}
            onChange={(e) => {
              setForm({ ...form, pain: e.target.value })
              setSaved(false)
            }}
          >
            {["None", "Mild", "Moderate", "Severe"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Symptoms / context
          <textarea
            value={form.symptoms}
            placeholder="Describe what changed…"
            onChange={(e) => {
              setForm({ ...form, symptoms: e.target.value })
              setSaved(false)
            }}
          />
        </label>
      </div>
      <button
        className="btn primary"
        onClick={() => {
          m.saveCheckin(form)
          setSaved(true)
        }}
      >
        {saved ? "Saved to mission record ✓" : "Save check-in"}
      </button>
      {saved && (
        <p role="status">
          Check-in saved. The support index and Copilot now use your fatigue
          report.
        </p>
      )}
      {form.pain === "Severe" && (
        <p className="care-alert">
          Severe symptoms need medical evaluation. Use the medical review
          pathway; a reassuring wearable reading does not rule out a problem.
        </p>
      )}
      </div></div>
    </Panel>
  )
}
export function DemoHealth({initialDomain=0}:{initialDomain?:number}) {
  const m = useMission()
  const [selected, setSelected] = useState(initialDomain),
    [note, setNote] = useState(""),
    [done, setDone] = useState("")
  const d = domains[selected]
  return (
    <div className="page fade-in">
      <Head eyebrow="WHOLE-PERSON HEALTH" title="Every signal has a place.">
        Explore your health, one connected system at a time. Choose a card to see its signals, evidence and next steps.
      </Head>
      <div className="health-domains sculpted-domains">
        {domains.map((x, i) => (
          <button
            className={selected === i ? "active" : ""}
            key={x.name}
            onClick={() => {
              setSelected(i)
              setDone("")
            }}
          >
            <span className="domain-number">{String(i + 1).padStart(2, "0")}</span>
            <div className="domain-sculpture" aria-hidden="true"><Suspense fallback={<MaterialPlaceholder/>}><SpaceMaterial kind="domain" domain={i}/></Suspense></div>
            <span className="domain-open" aria-hidden="true">↗</span>
            <strong>{x.name}</strong>
            <small>
              {i < 4 ? "Core health domain" : "Additional health domain"}
            </small>
            <b>{x.indicator}</b>
          </button>
        ))}
      </div>
      <Panel title={d.name} className="compact-domain-detail">
        <div className="domain-detail-layout"><div className="detail-sculpture"><Suspense fallback={<MaterialPlaceholder/>}><SpaceMaterial kind="domain" domain={selected}/></Suspense><span className="eyebrow">YOUR NEXT STEP / {String(selected+1).padStart(2,"0")}</span></div><div className="detail-fields">
        <div className="lab-readouts">
          <div>
            <small>Indicators</small>
            <strong>{d.indicator}</strong>
          </div>
          <div>
            <small>Source pathway</small>
            <strong>{d.source}</strong>
          </div>
          <div>
            <small>Evidence gap</small>
            <strong>{d.gap}</strong>
          </div>
        </div>
        <div className="care-path">
          <span>01 · Collect</span>
          <span>02 · Evaluate</span>
          <span>03 · Act</span>
          <span>04 · Follow up</span>
        </div>
        <label className="field-label">
          Observation or action context
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an observation, intake log, symptom or question…"
          />
        </label>
        <div className="lab-controls">
          <button
            className="btn primary"
            onClick={() => {
              m.log(
                "Health action",
                `${d.name}: ${d.action}. ${note || "No additional context."}`,
              )
              setDone(`${d.action} logged to the local action queue.`)
              setNote("")
            }}
          >
            {d.action}
          </button>

        </div>
        {done && <p role="status">{done}</p>}
        </div></div>
      </Panel>
      {(selected===1 || selected===2) && <Panel title={selected===1?"Pocket biomarker reader · periodic assessment":"Compact bone-scan attachment · periodic assessment"}><span className="badge info">RESEARCH CONCEPT · ILLUSTRATIVE RECORD</span><div className="lab-readouts"><div><small>{selected===1?"Assay / indicator":"Acoustic indicator"}</small><strong>{selected===1?"CRP · 1.2 mg/L":"Acoustic speed · 3,500 m/s"}</strong></div><div><small>Source</small><strong>{selected===1?"Blood cartridge reader concept":"Quantitative ultrasound attachment concept"}</strong></div><div><small>Interpretation</small><strong>{selected===1?"Inflammation-related context; not total immune function":"Site-specific acoustic measurement; not DXA-equivalent density"}</strong></div></div><p>Periodic measurements complement daily wearable readings. The module, acquisition method and quality controls require validation before clinical use.</p></Panel>}
      <details className="evidence-disclosure"><summary>Periodic tests & evidence records <span>Record a sample, assessment or scheduled follow-up ↗</span></summary><SampleRecords /></details>
      <Panel title="Evidence across the mission">
        <div className="lab-readouts">
          <div>
            <small>Immune</small>
            <strong>{m.signals.temperature} °C</strong>
            <p>{m.signals.immuneResult}</p>
          </div>
          <div>
            <small>Bone & muscle</small>
            <strong>{m.scores.adherence}% exercise adherence</strong>
            <p>
              {m.signals.sessions}/{m.signals.planned} scheduled sessions. No
              bone density estimate.
            </p>
          </div>
          <div>
            <small>Habitat</small>
            <strong>{m.signals.co2} ppm CO₂</strong>
            <p>Synthetic cabin stream. Radiation: {m.signals.radiation}.</p>
          </div>
        </div>
      </Panel>
    </div>
  )
}
export function ScoreExplanation() {
  const m = useMission()
  const s = m.scores
  return (
    <details className="card mission-panel score-details">
      <summary>How the support index is calculated <span className="index-summary-value">{s.load} / 100</span></summary><div className="index-component-grid">{[{label:"Sleep shortfall",value:s.sleep,weight:"50%"},{label:"Reported fatigue",value:s.fatigue,weight:"30%"},{label:"Exercise gap",value:s.exercise,weight:"20%"}].map(x=><div key={x.label}><small>{x.label}</small><strong>{x.value}<span> /100</span></strong><div className="index-component-track"><i style={{width:`${Math.min(100,x.value)}%`}}/></div><span className="component-weight">Weight {x.weight}</span></div>)}</div>
      <p>
        This is a transparent support-priority illustration, not a validated
        wellbeing score, disease risk or medical confidence percentage.
      </p>
      <div className="formula-block">
        Index = 0.50 × sleep shortfall + 0.30 × reported fatigue + 0.20 ×
        exercise gap
      </div>
      <p>
        Sleep shortfall = clamp((8 − hours slept) / 8 × 100). Fatigue = your
        0–10 response × 10. Exercise gap = (1 − completed / scheduled sessions)
        × 100.
      </p>
      <p>
        Current calculation: 0.50 × {s.sleep} + 0.30 × {s.fatigue} + 0.20 ×{" "}
        {s.exercise} ≈ <b>{s.load}</b>. Displayed components are rounded; the
        result uses full precision. Weights and targets are illustrative design
        choices.
      </p>
      <p>
        Training-reference deviation: z = (current − reference mean) / reference
        standard deviation. Pulse z: {s.pulseZ ?? "withheld"}; HRV z:{" "}
        {s.hrvZ ?? "withheld"}. The synthetic mean/SD are 64/5 bpm and 48/8 ms,
        not learned from an astronaut.
      </p>
      <p>
        No immune-function or bone-density score is calculated. The 48-hour view
        uses an explicit scenario model, not a trained predictor.
      </p>
    </details>
  )
}
export function DemoInsights() {
  const m = useMission()
  return (
    <div className="page fade-in">
      <Head eyebrow="YOUR HEALTH INSIGHTS" title="What changed, and why?">
        Readings, source quality and missing evidence stay next to the
        recommended action.
      </Head>
      <Panel title={m.notice.title} className="insights-panel">
        <p>{m.notice.body}</p>
        <div className="evidence-table">
          {[
            [
              "Pulse",
              m.signals.pulse === null ? "Withheld" : `${m.signals.pulse} bpm`,
              "Synthetic optical input",
              m.scores.pulseZ === null
                ? "Contact failed"
                : `z = ${m.scores.pulseZ}`,
            ],
            [
              "HRV",
              m.signals.hrv === null ? "Withheld" : `${m.signals.hrv} ms`,
              "Synthetic derived signal",
              m.scores.hrvZ === null
                ? "Contact failed"
                : `z = ${m.scores.hrvZ}`,
            ],
            [
              "Sleep",
              `${m.signals.sleep} hours`,
              "Synthetic sleep log",
              "Target 8 hours",
            ],
            [
              "Fatigue",
              `${m.checkin.fatigue}/10`,
              "Saved self-report",
              "Not inferred from sensors",
            ],
            [
              "Exercise",
              `${m.signals.sessions}/${m.signals.planned} sessions`,
              "Synthetic prescribed plan",
              `${m.scores.adherence}% adherence`,
            ],
            [
              "Temperature",
              `${m.signals.temperature} °C`,
              "Synthetic thermometer",
              "Immune assay unavailable",
            ],
            [
              "Cabin CO₂",
              `${m.signals.co2} ppm`,
              "Synthetic habitat stream",
              "Sample review threshold 2,000 ppm",
            ],
          ].map(([a, b, c, d]) => (
            <div key={a}>
              <strong>{a}</strong>
              <span className="evidence-value">{b}</span>
              <small>{c}</small>
              <small>{d}</small>
            </div>
          ))}
        </div>
        <p>
          These are scenario-driven demonstration rules. They are not clinical
          thresholds. Missing laboratory, ECG, BP and dosimeter inputs remain
          unknown.
        </p>
        <button
          className="btn secondary"
          onClick={() =>
            m.log("Evidence reviewed", `${m.scenario}: ${m.notice.action}`)
          }
        >
          Acknowledge evidence
        </button>
      </Panel>
      <ScoreExplanation />
      <Panel title="Personal model · training reference">
        <p>
          HALO’s demonstrated personalization combines a synthetic individual
          reference, your saved fatigue report and your action history. It is
          not a separately trained model.
        </p>
        <p>
          Mission-phase adaptation and clinically reviewed limits are planned. A
          persistent adverse trend must not silently become the new normal.
        </p>
      </Panel>
    </div>
  )
}
export function DemoWellbeing() {
  const m = useMission()
  const [metric, setMetric] = useState("Heart rate")
  const [range,setRange]=useState(30)
  const history = sampleHistory.slice(-range, -1)
  const values = [...history.map(row=>metric==="Heart rate"?row.pulse:metric==="HRV"?row.hrv:row.sleep),metric==="Heart rate"?m.signals.pulse:metric==="HRV"?m.signals.hrv:m.signals.sleep]
  const step=510/(values.length-1)
  const nums = values.filter((x): x is number => x !== null)
  const lo = Math.min(...nums) - 2,
    hi = Math.max(...nums) + 2
  const pts = values
    .map((v, i) =>
      v === null
        ? null
        : `${40 + i * step},${160 - ((v - lo) / (hi - lo)) * 120}`,
    )
    .filter(Boolean)
    .join(" ")
  return (
    <div className="page fade-in">
      <Head
        eyebrow="PERSONAL REFERENCE · SYNTHETIC HISTORY"
        title="Patterns, with context."
      >
        Thirty days of fictional mission records show sleep, recovery and movement patterns. The last point reflects your current record.
      </Head>
      <Panel title={`${metric} · ${range}-day history`} className="signal-history-panel">
        <div className="metric-pills">{[7,14,30].map(days=><button key={days} className={range===days?"active":""} onClick={()=>setRange(days)}>{days} days</button>)}</div>
        <div className="metric-pills">
          {["Heart rate", "HRV", "Sleep"].map((x) => (
            <button
              className={x === metric ? "active" : ""}
              key={x}
              onClick={() => setMetric(x)}
            >
              {x}
            </button>
          ))}
        </div>
        <svg
          className="mission-trend"
          viewBox="0 0 600 200"
          role="img"
          aria-label={`${metric} sample mission trend`}
        ><defs><linearGradient id="signal-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d2a3e4" stopOpacity=".25"/><stop offset="100%" stopColor="#d2a3e4" stopOpacity="0"/></linearGradient></defs>{[40,80,120,160].map(y=><line key={y} x1="40" x2="550" y1={y} y2={y} stroke="#c6a5df15" strokeDasharray="3 5"/>)}<polygon points={`40,170 ${pts} 550,170`} fill="url(#signal-area)"/>
          {[40,100,160].map(y=><text key={`scale-${y}`} x="31" y={y+3} textAnchor="end" fill="#a58bb7" fontSize="9">{(lo+(160-y)/120*(hi-lo)).toFixed(metric==="Sleep"?1:0)}</text>)}
          <line x1="40" y1="170" x2="550" y2="170" stroke="#485063" />
          <polyline points={pts} fill="none" stroke="#a79ce8" strokeWidth="3" />
          {values.map(
            (v, i) =>
              v !== null && (
                <g key={i}>
                  <circle
                    cx={40 + i * step}
                    cy={160 - ((v - lo) / (hi - lo)) * 120}
                    r="3"
                    fill="#7bd8c6"
                  />
                  <text
                    x={40 + i * step}
                    y="193"
                    textAnchor="middle"
                    fill="#aab3c5"
                    fontSize="12"
                  >
                    {i === values.length-1 ? "Now" : i%5===0 ? `D${history[i].day}` : ""}
                  </text>
                </g>
              ),
          )}
        </svg>
        <div className="lab-readouts">
          <div>
            <small>Current</small>
            <strong>
              {values[values.length-1] ?? "Unavailable"}{" "}
              {metric === "Sleep" ? "h" : metric === "HRV" ? "ms" : "bpm"}
            </strong>
          </div>
          <div>
            <small>Source</small>
            <strong>Sample mission record</strong>
          </div>
          <div>
            <small>Quality</small>
            <strong>
              {metric === "Sleep" ? "Illustrative log" : m.signals.quality}
            </strong>
          </div>
        </div>
      </Panel>
      <ScoreExplanation />
<details className="evidence-disclosure"><summary>Browse 30 days of sample records</summary><div className="history-table-wrap"><table className="sample-history-table"><thead><tr>{["Mission day","Pulse","HRV","Sleep","Temperature","Fatigue","Movement","Mood"].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{sampleHistory.map((row,i)=>i===sampleHistory.length-1?{...row,pulse:m.signals.pulse,hrv:m.signals.hrv,sleep:m.signals.sleep,temperature:m.signals.temperature,fatigue:m.checkin.fatigue,mood:m.checkin.mood,exerciseMinutes:m.signals.sessions<4?0:35}:row).reverse().map(row=><tr key={row.day}><td>Day {row.day}</td><td>{row.pulse ?? "—"} bpm</td><td>{row.hrv ?? "—"} ms</td><td>{row.sleep} h</td><td>{row.temperature} °C</td><td>{row.fatigue}/10</td><td>{row.exerciseMinutes} min</td><td>{row.mood}</td></tr>)}</tbody></table></div></details>
    </div>
  )
}
export function ActionHistory() {
  const m = useMission()
  return (
    <Panel title="Actions & follow-up">
      <p>
        Recorded actions show what you tried. A change afterward is not proof
        the action caused it.
      </p>
      {m.logs.length === 0 ? (
        <p>No actions yet.</p>
      ) : (
        m.logs.slice(0, 12).map((l) => (
          <div className="action-entry" key={l.id}>
            <div>
              <strong>{l.type}</strong>
              <small>
                {new Date(l.at).toLocaleString()} ·{" "}
                {l.synced ? "Sample ground inbox" : "Local queue"}
              </small>
              <p>{l.text}</p>
            </div>
    </div>
        ))
      )}
    </Panel>
  )
}
export function DemoSupport() {
  const m = useMission()
  const [kind, setKind] = useState("Guided breathing"),
    [duration, setDuration] = useState(120),
    [remaining, setRemaining] = useState(120),
    [running, setRunning] = useState(false),
    [started, setStarted] = useState(false),
    [before, setBefore] = useState(m.checkin.fatigue),
    [after, setAfter] = useState(m.checkin.fatigue),
    [recorded, setRecorded] = useState(false)
  const [exerciseDone, setExerciseDone] = useState(false)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setRemaining((n) => Math.max(0, n - 1)), 1000)
    return () => clearInterval(t)
  }, [running])
  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false)
      m.log(
        "Support completed",
        `${kind}; duration ${duration}s; follow-up pending.`,
      )
    }
  }, [remaining, running])
  const phase = (duration - remaining) % 16
  return (
    <div className="page fade-in">
      <Head
        eyebrow="CHOOSE → TRY → FOLLOW UP"
        title="Support you can actually use."
      >
        A guided session, reviewed exercise-plan check and a record of your own
        response.
      </Head>
      <div className="support-layout">
        <Panel title="Protected recovery session">
          <div className="metric-pills">
            {["Guided breathing", "Recovery break", "Wind-down"].map((x) => (
              <button
                disabled={started}
                className={kind === x ? "active" : ""}
                key={x}
                onClick={() => setKind(x)}
              >
                {x}
              </button>
            ))}
          </div>
          <div className={`breathing-orb ${running ? "running" : ""}`}>
            <strong>
              {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </strong>
            <span>
              {!running
                ? remaining === 0
                  ? "Session complete"
                  : "Ready / paused"
                : kind === "Guided breathing"
                  ? phase < 4
                    ? "Breathe in gently"
                    : phase < 8
                      ? "Pause comfortably"
                      : "Breathe out slowly"
                  : "A quiet moment"}
            </span>
          </div>
          <p>
            Stay comfortable and stop if you feel unwell. Follow your crew’s
            care plan.
          </p>
          <label className="field-label">
            Session length
            <select
              disabled={started}
              value={duration}
              onChange={(e) => {
                setDuration(+e.target.value)
                setRemaining(+e.target.value)
              }}
            >
              <option value={20}>20 seconds · quick reset</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </label>
          <div className="lab-controls">
            <button
              className="btn primary"
              disabled={remaining === 0}
              onClick={() => {
                if (!started) {
                  setBefore(m.checkin.fatigue)
                  m.log(
                    "Support started",
                    `${kind}; fatigue before ${m.checkin.fatigue}/10`,
                  )
                  setStarted(true)
                }
                setRunning(!running)
              }}
            >
              {running ? "Pause" : started ? "Resume" : "Start session"}
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                if (started && remaining > 0)
                  m.log(
                    "Support stopped",
                    `${kind} stopped after ${duration - remaining}s`,
                  )
                setStarted(false)
                setRunning(false)
                setRemaining(duration)
                setRecorded(false)
              }}
            >
              Reset session
            </button>
          </div>
        </Panel>
        <Panel title="How did you respond?">
          <p>
            Before session: fatigue {before}/10. Your follow-up is a
            self-report, not a predicted outcome.
          </p>
          <label className="fatigue-control">
            Now: {after}/10
            <input
              type="range"
              min="0"
              max="10"
              value={after}
              onChange={(e) => setAfter(+e.target.value)}
            />
          </label>
          <button
            className="btn primary"
            disabled={!started || recorded}
            onClick={() => {
              m.log(
                "Support follow-up",
                `${kind}: fatigue ${before} → ${after}/10; ${
                  remaining === 0 ? "completed" : "partial"
                } session. Self-reported association only.`,
              )
              m.saveCheckin({ ...m.checkin, fatigue: after })
              setRecorded(true)
            }}
          >
            {recorded ? "Follow-up saved ✓" : "Save response"}
          </button>
          <p>
            {recorded
              ? "Your check-in and support index now reflect the new fatigue report."
              : "Start a session to record your response."}
          </p>
        </Panel>
      </div>
      <Panel title="Bone & muscle · prescribed-plan check">
        <p>
          Scenario plan: {m.signals.sessions}/{m.signals.planned} resistance
          sessions complete ({m.scores.adherence}%). This is exercise adherence,
          not a bone-density measurement.
        </p>
        <button
          className="btn secondary"
          disabled={exerciseDone}
          onClick={() => {
            m.log(
              "Exercise review",
              "Reviewed the synthetic resistance plan. Load and exercise changes require the crew’s approved plan.",
            )
            setExerciseDone(true)
          }}
        >
          {exerciseDone ? "Plan review logged" : "Log prescribed-plan review"}
        </button>
      </Panel>
      <Panel title="Log a prescribed exercise session"><p>Only complete sessions from the crew-approved sample plan. This updates plan adherence and the support index; it does not claim an increase in bone density.</p><button className="btn primary" disabled={m.signals.sessions>=m.signals.planned} onClick={m.completeExercise}>{m.signals.sessions>=m.signals.planned?"All scheduled sessions logged":"Log one completed session"}</button><p>{m.signals.sessions}/{m.signals.planned} sessions complete · {m.scores.adherence}% adherence</p></Panel>
      <ActionHistory />
    </div>
  )
}
export function DemoFuture() {
  const m = useMission()
  const [intervention, setIntervention] = useState("Recovery break")
  const effect: Record<string, number> = {
    "Recovery break": 8,
    "Family connection": 6,
    "Guided breathing": 5,
    "Sleep support": 12,
  }
  const current = m.scores.load
  const rows = [0, 6, 12, 24, 48].map((t, i) => ({
    t,
    base: Math.min(100, current + i * 3),
    with: Math.max(0, current - (i * effect[intervention]) / 4),
  }))
  const xy = (i: number, n: number) => `${50 + i * 125},${185 - n * 1.4}`
  return (
    <div className="page fade-in">
      <Head
        eyebrow="FUTURE SELF · EXPLICIT SCENARIO MODEL"
        title="Explore a possible next step."
      >
        Illustrative 48-hour support-index trajectories. These are generated by
        fixed sample assumptions, not a trained health prediction model.
      </Head>
      <Panel title="What if you choose support?" className="future-chart-panel">
        <div className="metric-pills">
          {Object.keys(effect).map((x) => (
            <button
              className={intervention === x ? "active" : ""}
              key={x}
              onClick={() => setIntervention(x)}
            >
              {x}
            </button>
          ))}
        </div>
        <svg
          viewBox="0 0 600 220"
          className="mission-trend"
          aria-label="Illustrative support-index trajectories"
          role="img"
        >
          <polyline
            points={rows.map((r, i) => xy(i, r.base)).join(" ")}
            stroke="#d9a06f"
            strokeWidth="3"
            fill="none"
          />
          <polyline
            points={rows.map((r, i) => xy(i, r.with)).join(" ")}
            stroke="#83d9bc"
            strokeWidth="3"
            fill="none"
          />
          {rows.map((r, i) => (
            <text
              key={r.t}
              x={50 + i * 125}
              y="213"
              textAnchor="middle"
              fill="#aab3c5"
              fontSize="12"
            >
              {r.t === 0 ? "Now" : `+${r.t}h`}
            </text>
          ))}
        </svg>
        <div className="lab-controls">
          <span className="badge good">With chosen support</span>
          <span className="badge attention">No change assumption</span>
        </div>
        <p>
          Starting index: {current}. No-change curve adds 3 points per step.
          Support curve subtracts {effect[intervention]}/4 points per step.
          Values are capped between 0 and 100. Lower means less calculated
          support demand; actual outcomes can differ.
        </p>
        <button
          className="btn secondary"
          onClick={() =>
            m.log(
              "Scenario explored",
              `${intervention}: illustrative 48-hour scenario, starting index ${current}. Not a prediction.`,
            )
          }
        >
          Save scenario to my record
        </button>
      </Panel>
      <ScoreExplanation />
    </div>
  )
}
export function DemoMedical() {
  const m = useMission()
  const [symptoms, setSymptoms] = useState(m.checkin.symptoms),
    [allergy, setAllergy] = useState("Unknown"),
    [requested, setRequested] = useState(false),
    [confirm, setConfirm] = useState(false)
  return (
    <div className="page fade-in">
      <Head
        eyebrow="MISSION MEDICAL KIT · REVIEW WORKFLOW"
        title="Care with a clear chain of decisions."
      >
        Inventory and a simulated medical review. HALO does not select a drug or
        generate a dose.
      </Head>
      <Panel title="01 · Symptoms and safety context" className="medical-context-panel">
        <div className="form-grid">
          <label>
            Symptoms / reason for review
            <textarea
              value={symptoms}
              onChange={(e) => {
                setSymptoms(e.target.value)
                setRequested(false)
                setConfirm(false)
                m.clearApprovals()
              }}
              placeholder="Describe symptoms, onset and context…"
            />
          </label>
          <label>
            Allergy record status
            <select
              value={allergy}
              onChange={(e) => {
                setAllergy(e.target.value)
                setRequested(false)
                setConfirm(false)
                m.clearApprovals()
              }}
            >
              <option>Unknown</option>
              <option>Needs medical verification</option>
              <option>Reviewed in sample</option>
            </select>
          </label>
        </div>
        <button
          className="btn primary"
          disabled={!symptoms.trim()}
          onClick={() => {
            m.clearApprovals()
            m.log(
              "Medical review requested",
              `Symptoms: ${symptoms}; allergy status: ${allergy}. Clinician review needed.`,
            )
            setRequested(true)
          }}
        >
          {requested ? "Review request queued ✓" : "Request medical review"}
        </button>
        <p>
          Requests are local records. No real clinician is contacted. Urgent
          symptoms require the mission’s emergency pathway.
        </p>
      </Panel>
      <Panel title="02 · Simulated officer review" className="medical-review-panel">
        <p>
          This control lets the presenter demonstrate the reviewer’s role. It is
          not actual clinical authorization or an allergy/interaction check.
        </p>
        <label className="sample-checkbox">
          <input
            type="checkbox"
            checked={confirm}
            disabled={!requested}
            onChange={(e) => setConfirm(e.target.checked)}
          />{" "}
          Presenter: simulate an officer reviewing the context
        </label>
      </Panel>
      <Panel title="03 · Available kit items" className="medical-inventory-panel">
        <div className="kit-grid">
          {Object.entries(m.stock).map(([name, stock]) => (
            <div className="kit-item" key={name}><div className="kit-sculpture" aria-hidden="true"><i className={name.startsWith("Oral")?"supply-droplet":name.startsWith("Wound")?"supply-cross":"supply-capsule"}/><b/></div>
              <span className="eyebrow">SAMPLE INVENTORY</span>
              <h3>{name}</h3>
              <strong>{stock} remaining</strong>
              <p>
                {name === "Crew-prescribed medication"
                  ? "Existing crew prescription only. Drug, indication and dose are intentionally not generated here."
                  : "Record supplies against the reviewed care plan."}
              </p>
              <button
                className="btn secondary"
                disabled={
                  !requested ||
                  !confirm ||
                  allergy !== "Reviewed in sample" ||
                  stock === 0 ||
                  m.approved.includes(name)
                }
                onClick={() => m.approve(name)}
              >
                {m.approved.includes(name)
                  ? "Sample review recorded"
                  : "Simulate item review"}
              </button>
              <button
                className="btn primary"
                disabled={
                  !requested ||
                  !confirm ||
                  allergy !== "Reviewed in sample" ||
                  !m.approved.includes(name) ||
                  stock === 0
                }
                onClick={() => m.useStock(name)}
              >
                Log one item used
              </button>
            </div>
          ))}
        </div>
        <p>
          Each use consumes one sample approval, decrements inventory and creates
          an audit entry. No autonomous dosing.
        </p>
      </Panel>
      <ActionHistory />
    </div>
  )
}
function downloadReport(m: ReturnType<typeof useMission>) {
  const body = {
    label: "HALO synthetic mission sample; not a clinical report",
    generated: new Date().toISOString(),
    scenario: m.scenario,
    signals: m.signals,
    checkin: m.checkin,
    supportIndex: m.scores,
    assessment: m.notice,
    manualEvidence: m.evidence,
    missingEvidence: [
      "ECG",
      "BP",
      "Immune assay",
      "Bone density",
      "Radiation dosimeter",
    ],
    actions: m.logs,
  }
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(body, null, 2)], { type: "application/json" }),
  )
  const a = document.createElement("a")
  a.href = url
  a.download = "halo-mission-handoff.json"
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function DemoHandoff() {
  const m = useMission()
  const [status, setStatus] = useState("")
  return (
    <div className="page fade-in">
      <Head
        eyebrow="LOCAL FIRST · REVIEWABLE HANDOFF"
        title="Keep the record. Share the essentials."
      >
        Check-ins and action records survive browser reloads. The ground inbox
        below receives records through the mission server. No Earth-side service is connected.
      </Head>
      <div className="two-col">
        <Panel title="Onboard action queue">
          <strong className="big-stat">
            {m.logs.filter((l) => !l.synced).length}
          </strong>
          <p>
            Pending records.{" "}
            {m.offline
              ? "Offline: records stay queued on this browser."
              : "Ready for transfer to the mission server."}
          </p>
          <button
            className="btn primary"
            disabled={m.offline || !m.logs.some((l) => !l.synced)}
            onClick={() => {
              m.sync()
              setStatus(
                "Transfer requested. Records are marked delivered only after the mission server confirms receipt.",
              )
            }}
          >
            Save to mission inbox
          </button>
          <button className="btn secondary" onClick={() => downloadReport(m)}>
            Export handoff JSON
          </button>
          {status && <p role="status">{status}</p>}
        </Panel>
        <Panel title="Review summary">
          <p>
            {m.notice.title}: {m.notice.body}
          </p>
          <p>
            Latest self-report: {m.checkin.mood}; fatigue {m.checkin.fatigue}
            /10; symptoms {m.checkin.symptoms || "none reported"}.
          </p>
          <p>
            Missing verified evidence: laboratory immune result, bone density, ECG, BP and radiation dose. Manual records remain unverified.
          </p>
        </Panel>
      </div>
      <Panel title="Mission inbox">
        {m.logs.filter((l) => l.synced).length === 0 ? (
          <p>No transferred records yet.</p>
        ) : (
          m.logs
            .filter((l) => l.synced)
            .slice(0, 10)
            .map((l) => (
              <div className="action-entry" key={l.id}>
                <strong>{l.type}</strong>
                <p>{l.text}</p>
              </div>
            ))
        )}
      </Panel>
      <ActionHistory />
    </div>
  )
}
const relatives = [
  {
    name: "Mei",
    role: "Mom",
    initials: "MC",
    opening:
      "Hi Maya. Take a little time for yourself. What would you like to talk about?",
  },
  {
    name: "Daniel",
    role: "Dad",
    initials: "DC",
    opening:
      "Hey Maya. I’m here for a quiet conversation. How has your day felt?",
  },
  {
    name: "Lily",
    role: "Sister",
    initials: "LC",
    opening: "Maya! Let’s take a little break together. What’s on your mind?",
  },
]
function companionReply(text: string, index: number) {
  const t = text.toLowerCase(),
    name = relatives[index].name
  if (/news|happen|garden/.test(t))
    return `This is ${name}’s sample companion. I don’t know today’s news from home. You can play a real recording or queue a message for your family.`
  if (/tired|stress|alone|miss|sad/.test(t))
    return index === 0
      ? "That sounds like a demanding day. Would you like a quiet moment, or to leave a message for someone at home?"
      : index === 1
        ? "You don’t have to solve everything in this conversation. We can pause, or you can ask a crewmate for support."
        : "I’m here for this little break. Want to talk about a favourite memory, or send a real message home?"
  return index === 0
    ? "Thank you for sharing that. What part of your day would you like to talk about next?"
    : index === 1
      ? "Let’s take it one step at a time. What would make the next few minutes easier?"
      : "We could recall a favourite Earth moment together. You can also upload a real family recording below."
}
export function DemoFamily() {
  const m = useMission()
  const [index, setIndex] = useState(0),
    [consent, setConsent] = useState(false),
    [voice, setVoice] = useState(true),
    [text, setText] = useState(""),
    [messages, setMessages] = useState<Record<number, {
      role: string
      text: string
    }[]>>({}),
    [status, setStatus] = useState(""),
    [file, setFile] = useState<string | null>(null),
    [filename, setFilename] = useState(""),
    [reply, setReply] = useState(""),
    [recording, setRecording] = useState(false)
  const media = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const blobs = useRef<Blob[]>([])
  const recognition = useRef<any>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [audioQueued, setAudioQueued] = useState(false)
  const audioBlob = useRef<Blob | null>(null)
  const active = relatives[index]
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel()
      recognition.current?.abort()
      if (media.current?.state === "recording") media.current.stop()
      stream.current?.getTracks().forEach((t) => t.stop())
    },
    [],
  )
  useEffect(
    () => () => {
      if (file) URL.revokeObjectURL(file)
    },
    [file],
  )
  useEffect(
    () => () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    },
    [recordedUrl],
  )
  useEffect(() => {
    if (!recording) return
    const t = setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [recording])
  const speak = (s: string) => {
    if (!voice || !("speechSynthesis" in window)) return
    window.speechSynthesis?.cancel()
    const u = new SpeechSynthesisUtterance(s)
    u.rate = index === 2 ? 1.05 : 0.92
    u.pitch = index === 1 ? 0.85 : index === 0 ? 1.1 : 1.2
    u.onerror = () =>
      setStatus(
        "Browser speech is unavailable; the text conversation still works.",
      )
    window.speechSynthesis.speak(u)
  }
  const sending = useRef(false)
  useEffect(()=>{loadConversations().then(all=>setMessages({0:all["family-0"]||[],1:all["family-1"]||[],2:all["family-2"]||[]})).catch(()=>{})},[])
  const send = async (override?: string) => {
    const input = (override ?? text).trim()
    if (!input || !consent || sending.current) return
    sending.current=true
    const selected=index, person=active.name
    setText(""); setStatus("Preparing your reply…")
    const fallback=companionReply(input,selected)
    try {
      if(m.offline)throw new Error()
      const result=await requestReply(input,`family-${selected}`,person,{checkin:m.checkin},fallback)
      setMessages(v=>({...v,[selected]:result.messages}))
      setStatus(result.engine==="local-model"?"Local AI reply · conversation saved":"Companion reply · conversation saved · scripted voice persona")
      speak(result.answer)
    } catch {
      setMessages(v=>({...v,[selected]:[...(v[selected]||[]),{role:"You",text:input},{role:person,text:fallback}]}))
      setStatus("Offline companion reply · not saved to server")
      speak(fallback)
    } finally {sending.current=false}
  }
  const listen = () => {
    const Speech =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    if (!Speech) {
      setStatus(
        "Speech recognition is not available in this browser. Type your message instead.",
      )
      return
    }
    const r = new Speech()
    recognition.current = r
    r.lang = "en-US"
    r.onresult = (e: any) => {
      setText(e.results[0][0].transcript)
      setStatus("Transcript ready. Review it, then send.")
    }
    r.onerror = () =>
      setStatus(
        "Microphone recognition unavailable or permission denied. You can type instead.",
      )
    r.onend = () => {
      recognition.current = null
    }
    setStatus(
      "Listening… browser recognition may require a network connection.",
    )
    r.start()
  }
  const record = async () => {
    if (recording) {
      media.current?.stop()
      setRecording(false)
      return
    }
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        setStatus("Recording is not supported. Use text reply.")
        return
      }
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = s
      const r = new MediaRecorder(s)
      media.current = r
      blobs.current = []
      setElapsed(0)
      setAudioQueued(false)
      r.ondataavailable = (e) => blobs.current.push(e.data)
      r.onstop = () => {
        const b = new Blob(blobs.current, { type: r.mimeType })
        audioBlob.current = b
        setRecordedUrl(URL.createObjectURL(b))
        s.getTracks().forEach((t) => t.stop())
        setStatus("Voice recording ready. Preview or download before queuing.")
      }
      r.start()
      setRecording(true)
    } catch {
      setStatus("Microphone permission unavailable. You can reply with text.")
    }
  }
  return (
    <div className="page fade-in">
      <Head
        eyebrow="CONNECTION · MULTIPLE FAMILY COMPANIONS"
        title="A little piece of Earth."
      >
        Three distinct scripted companions, optional browser speech, real audio
        uploads and recorded replies. These are not cloned family voices or live
        calls.
      </Head>
      <div className="connection-sculpture"><div className="connection-copy"><span className="eyebrow">FAR FROM EARTH. CLOSE TO HOME.</span><h2>A familiar voice.<br/><em>A softer landing.</em></h2><div className="connection-people"><span>MC</span><span>DC</span><span>LC</span><small>Your circle, always within reach.</small></div></div><Suspense fallback={<MaterialPlaceholder/>}><SpaceMaterial kind="family"/></Suspense></div>
      <div className="family-consent">
        <label className="sample-checkbox">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked)
              if (!e.target.checked) {
                window.speechSynthesis?.cancel()
                recognition.current?.abort()
              }
            }}
          />{" "}
          I understand these are AI-style simulations, not my family members.
        </label>
        <label className="sample-checkbox">
          <input
            type="checkbox"
            checked={voice}
            onChange={(e) => {
              setVoice(e.target.checked)
              if (!e.target.checked) window.speechSynthesis?.cancel()
            }}
          />{" "}
          Browser voice playback
        </label>
      </div>
      <div className="voice-layout">
        <div className="voice-agents">
          {relatives.map((r, i) => (
            <button
              className={`agent-pick ${i === index ? "active" : ""}`}
              key={r.name}
              onClick={() => {
                setIndex(i)
                window.speechSynthesis?.cancel()
                recognition.current?.abort()
                setStatus("")
              }}
            >
              <span className="agent-avatar">{r.initials}</span>
              <div>
                <strong>{r.name}</strong>
                <small>{r.role} · scripted sample persona</small>
              </div>
            </button>
          ))}
        </div>
        <section className="card family-conversation">
          <div className="card-title">
            {active.name} · {active.role}
          </div>
          <span className="badge info">
            Synthetic browser voice · not cloned
          </span>
          <div className="family-messages">
            <p>{active.opening}</p>
            {(messages[index] || []).map((x, i) => (
              <div
                className={`family-message ${x.role === "You" ? "self" : ""}`}
                key={i}
              >
                <small>{x.role}</small>
                <p>{x.text}</p>
              </div>
            ))}
          </div>
          <div className="family-input">
            <input
              disabled={!consent}
              value={text}
              placeholder={
                consent
                  ? "Tell me what is on your mind…"
                  : "Acknowledge the simulation to begin"
              }
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              className="btn primary"
              disabled={!consent || !text.trim()}
              onClick={() => send()}
            >
              Send
            </button>
            <button
              className="btn secondary"
              disabled={!consent}
              onClick={listen}
            >
              Mic
            </button>
          </div>
          <div className="metric-pills">
            {[
              "I feel tired today",
              "I miss home",
              "Tell me news from home",
            ].map((x) => (
              <button key={x} disabled={!consent} onClick={() => send(x)}>
                {x}
              </button>
            ))}
          </div>
          {status && <p role="status">{status}</p>}
        </section>
      </div>
      <div className="two-col">
        <Panel title="Real family memories">
          <p>
            Upload an audio or video recording you have permission to use. It
            plays locally and is not uploaded to a server.
          </p>
          <input
            aria-label="Upload family recording"
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                setFilename(f.name)
                setFile(URL.createObjectURL(f))
              }
            }}
          />
          {file && (
            <>
              <p>{filename}</p>
              <video src={file} controls className="family-media" />
            </>
          )}
        </Panel>
        <Panel title="Leave a message for home">
          <textarea
            aria-label="Family reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Your message to Earth…"
          />
          <button
            className="btn primary"
            disabled={!reply.trim()}
            onClick={() => {
              m.log("Family text queued", reply)
              setReply("")
              setStatus(
                "Text reply saved to the local handoff queue. No message was sent externally.",
              )
            }}
          >
            Queue text reply
          </button>
          <button className="btn secondary" onClick={record}>
            {recording ? `Stop recording · ${elapsed}s` : "Record voice reply"}
          </button>
          {recordedUrl && (
            <>
              <audio src={recordedUrl} controls />
              <div className="lab-controls">
                <a
                  className="btn secondary"
                  href={recordedUrl}
                  download="halo-family-reply.webm"
                >
                  Download recording
                </a>
                <button
                  className="btn primary"
                  disabled={audioQueued}
                  onClick={() => {
                    m.log(
                      "Family audio recorded",
                      `Voice recording ${elapsed}s; ${audioBlob.current?.size || 0} bytes. Audio is session-only: download it to keep the file. Queue stores metadata only.`,
                    )
                    setAudioQueued(true)
                    setStatus(
                      "Recording metadata queued. Download the audio before leaving this page.",
                    )
                  }}
                >
                  {audioQueued ? "Metadata queued" : "Queue recording metadata"}
                </button>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}
export function copilotAnswer(text: string, m: ReturnType<typeof useMission>) {
  const q = text.toLowerCase()
  if (/medicine|dose|drug|prescri/.test(q))
    return "I do not generate medication doses. Open Mission Medical Kit, record symptom and allergy context, then demonstrate officer review before logging inventory use. No real clinical approval occurs in this sample."
  if (/immune|fever|temperature/.test(q))
    return `Current synthetic temperature: ${m.signals.temperature} °C. ${m.signals.immuneResult}. Temperature, sleep and symptoms do not establish immune function. Record context and request medical review; laboratory evidence is still missing.`
  if (/bone|exercise|muscle/.test(q))
    return `Your synthetic plan has ${m.signals.sessions}/${m.signals.planned} resistance sessions complete: ${m.scores.adherence}% adherence. That is a completion measure, not bone density. Review your prescribed plan and record follow-up; no load or medication change is prescribed.`
  if (/score|calculat|index|confidence/.test(q))
    return `Your support index is ${m.scores.load}: 50% sleep shortfall, 30% reported fatigue and 20% exercise gap. Current components: ${m.scores.sleep}, ${m.scores.fatigue}, ${m.scores.exercise}. It is an illustrative prioritization formula, not a clinical score or validated prediction.`
  if (/family|alone|home|mental/.test(q))
    return `Your latest mood is ${m.checkin.mood}. You can choose a support session, play an actual family recording or talk with a clearly labeled scripted family companion. If you need human support, record a medical/support review request.`
  if (/radiation|vision|nutrition|hydration/.test(q))
    return "Health Overview includes exposure, vision, nutrition and hydration pathways. No dosimeter, ocular test or nutrition laboratory result is connected, so I cannot infer a normal result. Record observations and use the appropriate review pathway."
  if (/history|action|record/.test(q))
    return m.logs.length
      ? `Latest action: ${m.logs[0].type}. ${m.logs[0].text}. ${m.logs.filter((l) => !l.synced).length} local records await sample transfer.`
      : "No action is recorded yet. Complete a check-in or try a support session."
  return `${m.notice.title}. ${m.notice.body} Next: ${m.notice.action}. Latest check-in: ${m.checkin.mood}, fatigue ${m.checkin.fatigue}/10. ${
    m.scenario === "Poor contact"
      ? "Pulse and HRV interpretation are withheld."
      : `Pulse ${m.signals.pulse} bpm, HRV ${m.signals.hrv} ms; synthetic reference deviations ${m.scores.pulseZ} and ${m.scores.hrvZ}.`
  } I use deterministic sample rules, not a connected language model.`
}
export function DemoCopilot() {
  const m = useMission()
  const [input, setInput] = useState(""),
    [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [chatStatus,setChatStatus]=useState("Checking local conversation service")
  const sending=useRef(false)
  useEffect(()=>{loadConversations().then(all=>{setMessages(all.halo||[]);setChatStatus("Conversation record connected")}).catch(()=>setChatStatus("Offline assistant available"))},[])
  const send = async (override?: string) => {
    const t = (override ?? input).trim()
    if (!t || sending.current) return
    sending.current=true;setInput("");setChatStatus("HALO is preparing a reply…")
    const fallback=copilotAnswer(t,m)
    try {
      if(m.offline)throw new Error()
      const result=await requestReply(t,"halo","HALO",{signals:m.signals,checkin:m.checkin,scores:m.scores,notice:m.notice,logs:m.logs.slice(0,8)},fallback)
      setMessages(result.messages)
      setChatStatus(result.engine==="local-model"?"Local AI · reply saved":"Rule-based assistant · reply saved")
    } catch {
      setMessages(v=>[...v,{role:"You",text:t},{role:"HALO",text:fallback}])
      setChatStatus("Offline rule-based reply · not saved to server")
    } finally {sending.current=false}
  }
  return (
    <div className="page fade-in">
      <Head
        eyebrow="PERSONAL CONTEXT · HALO COPILOT"
        title="Ask HALO about your patterns."
      >
        Responses use the active scenario, saved check-in and action history.
        A local language model can provide conversational replies when installed; otherwise HALO uses transparent rule-based responses.
      </Head>
      <section className="card sample-chat">
        <div className="chat-header">
          <span className="brand-mark" />
          <div>
            <b>HALO Copilot</b>
            <small>{chatStatus}</small>
          </div>
        </div>
        <div className="sample-chat-thread">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-title">
                What would you like to understand?
              </div>
              <p>Try changing the scenario, then ask about your recovery.</p>
            </div>
          ) : (
            messages.map((x, i) => (
              <div
                className={`family-message ${x.role === "You" ? "self" : ""}`}
                key={i}
              >
                <small>{x.role}</small>
                <p>{x.text}</p>
              </div>
            ))
          )}
        </div>
        <div className="metric-pills">
          {[
            "What can I do now?",
            "How is my score calculated?",
            "Review my immune health",
            "Review bone protection",
            "Show my action history",
          ].map((x) => (
            <button key={x} onClick={() => send(x)}>
              {x}
            </button>
          ))}
        </div>
        <div className="family-input">
          <input
            aria-label="Message HALO"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about the active mission scenario…"
          />
          <button
            className="btn primary"
            disabled={!input.trim()}
            onClick={() => send()}
          >
            Send
          </button>
        </div>
      </section>
    </div>
  )
}
export function DemoPrivacy() {
  const m = useMission()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="page fade-in">
      <Head eyebrow="YOUR DATA CONTROL" title="Your record, your choice.">
        This workspace stores check-ins and actions in the browser and local server files. Storage is not
        encrypted; no external clinical service is connected.
      </Head>
      <Panel title="Review and export">
        <p>
          {m.logs.length} action records, a saved check-in and sample kit
          inventory are saved in this workspace. Chat conversations are saved on the local server; family media remains
          session-only. No real medical sharing or role-based access is
          implemented.
        </p>
        <button className="btn secondary" onClick={() => downloadReport(m)}>
          Export my record
        </button>
      </Panel>
      <Panel title="Start a fresh record">
        <p>
          Clear this sample’s mission record, inventory approvals, queue and saved
          check-in. Other browser data is untouched.
        </p>
        <label className="sample-checkbox">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
          />{" "}
          Clear my local HALO record
        </label>
        <button
          className="btn secondary"
          disabled={!confirm}
          onClick={() => {
            m.reset()
            setConfirm(false)
          }}
        >
          Reset mission record
        </button>
      </Panel>
    </div>
  )
}

function SampleRecords(){
 const m=useMission();const [kind,setKind]=useState("Immune laboratory result"),[value,setValue]=useState(""),[due,setDue]=useState(""),[message,setMessage]=useState("");
 return <Panel title="Assessments & evidence" className="compact-evidence"><div className="evidence-layout"><div className="evidence-sculpture"><Suspense fallback={<MaterialPlaceholder/>}><SpaceMaterial kind="hardware" device={kind.includes("Bone")?4:5}/></Suspense><span className="eyebrow">MEASURE · RECORD · FOLLOW UP</span><p>Keep the source and date with every result.</p></div><div className="evidence-fields"><div className="form-grid"><label>Record type<select value={kind} onChange={e=>{setKind(e.target.value);setMessage("")}}>{["Immune laboratory result","Bone scan / biomarker result","Blood pressure assessment","Nutrition / hydration assessment","Radiation exposure record","Vision assessment"].map(x=><option key={x}>{x}</option>)}</select></label><label>Next assessment<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label></div><label className="field-label">Source, date and result<textarea value={value} onChange={e=>setValue(e.target.value)} placeholder="Add the measurement, unit, source and assessment date…"/></label><div className="evidence-actions"><button className="btn primary" disabled={!value.trim()} onClick={()=>{m.saveEvidence(kind,value.trim());setValue("");setMessage("Evidence saved to your mission record.")}}>Save evidence record</button><button className="btn secondary" disabled={!due} onClick={()=>{m.log("Assessment scheduled",`${kind}: scheduled ${due}; collection and laboratory analysis require the appropriate mission equipment.`);setMessage(`Assessment scheduled for ${due}.`)}}>Schedule assessment</button></div><small className="evidence-footnote">Schedule entries stay in your mission record; external reminders are not enabled.</small>{message&&<p role="status">{message}</p>}</div></div>{Object.entries(m.evidence).map(([k,v])=><div className="action-entry" key={k}><strong>{k} · manual record</strong><p>{v}</p></div>)}</Panel>
}
export function DemoSettings({go}:{go:(p:any)=>void}){const m=useMission();return <div className="page fade-in"><Head eyebrow="SAMPLE CONTROLS" title="Your mission preferences.">Choose a mission scenario, test communication delay and manage the local record.</Head><Panel title="Mission simulation"><label className="field-label">Scenario<select value={m.scenario} onChange={e=>m.setScenario(e.target.value as Scenario)}>{scenarios.map(s=><option key={s}>{s}</option>)}</select></label><label className="sample-checkbox"><input type="checkbox" checked={m.offline} onChange={e=>m.setOffline(e.target.checked)}/> Simulate offline communication</label><p>Offline mode pauses server saves and inbox transfers. Browser check-ins and logging continue.</p></Panel><Panel title="Workspace shortcuts"><p>{m.backendStatus}</p><button className="btn secondary" onClick={()=>go("hardware")}>Open My Wearables</button><button className="btn secondary" onClick={()=>go("privacy")}>Export or reset sample data</button><p>Explore your equipment, manage your record and keep the mission workspace organized.</p></Panel></div>}
