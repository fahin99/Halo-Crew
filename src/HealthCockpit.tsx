import { useState } from "react"
import { Area, ComposedChart, CartesianGrid, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useMission } from "./mission-state"
import { sampleHistory } from "./sample-history"
import {
  STATUS, GUIDES, ROUTINE, worst, domainStatuses, bpStatus, glucoseStatus, doseStatus, temperatureStatus,
  oxygenStatus, pulseStatus, sleepStatus, validateVitals, type Status,
} from "./vitals"

export function StatusChip({ status, label }: { status: Status; label?: string }) {
  return <span className={`status-chip st-${status}`}><i aria-hidden="true">{STATUS[status].mark}</i>{label ?? STATUS[status].label}</span>
}

export function useDomainStatuses() {
  const m = useMission()
  return domainStatuses({ signals: m.signals, pulseZ: m.scores.pulseZ, checkin: m.checkin, vitals: m.vitals })
}

export function StatusLegend() {
  return <div className="status-legend" aria-label="Status colour key">{(["good", "watch", "act", "urgent", "unknown"] as Status[]).map(s => <span key={s}><StatusChip status={s} /><small>{STATUS[s].tier}</small></span>)}</div>
}

// Marker positions on the figure, in Health Overview domain order.
const SPOTS: [number, number][] = [[136, 146], [120, 104], [104, 338], [120, 34], [166, 30], [120, 210], [80, 124], [102, 154], [132, 62], [180, 214]]

export function BodyMap({ names, selected, onSelect }: { names: string[]; selected: number; onSelect: (i: number) => void }) {
  const statuses = useDomainStatuses()
  const overall = worst(...statuses.map(s => s.status))
  const active = statuses[selected]
  return <section className="body-map card mission-panel" aria-label="Body status map">
    <div className="body-map-figure">
      <svg viewBox="0 0 240 430" role="group" aria-label="Human figure with clickable health areas">
        <defs><linearGradient id="bm-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#efdcf7" stopOpacity=".2" /><stop offset="1" stopColor="#b48ccb" stopOpacity=".07" /></linearGradient></defs>
        <ellipse className="bm-halo" cx="120" cy="412" rx="70" ry="12" />
        <g className="bm-outline">{/* drawn first, slightly wider, to give the silhouette an edge */}<circle cx="120" cy="50" r="32" /><rect x="108" y="78" width="24" height="22" rx="8" /><path d="M72 112q48-22 96 0l-6 120q-2 30-42 32-40-2-42-32Z" /><path className="bm-limb" d="M76 116 54 196 44 268M164 116l22 80 10 72" /><path className="bm-limb leg" d="M102 262 96 334 92 404M138 262l6 72 4 70" /></g>
        <g className="bm-body"><circle cx="120" cy="50" r="32" /><rect x="108" y="78" width="24" height="22" rx="8" /><path d="M72 112q48-22 96 0l-6 120q-2 30-42 32-40-2-42-32Z" /><path className="bm-limb" d="M76 116 54 196 44 268M164 116l22 80 10 72" /><path className="bm-limb leg" d="M102 262 96 334 92 404M138 262l6 72 4 70" /></g>
        <g className="bm-organs" aria-hidden="true"><path d="M104 40q16-14 32 0M106 52q14-8 28 0" /><path d="M96 140q-10 30 4 52q10-4 12-26-2-22-16-26ZM144 140q10 30-4 52q-10-4-12-26 2-22 16-26Z" /></g>
        {SPOTS.map(([x, y], i) => {
          const s = statuses[i].status
          return <g key={i} className={`bm-spot st-${s} ${selected === i ? "selected" : ""}`} role="button" tabIndex={0} aria-label={`${names[i]}: ${statuses[i].label ?? STATUS[s].label}`} aria-pressed={selected === i} onClick={() => onSelect(i)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(i) } }}>
            {(s === "act" || s === "urgent" || s === "watch") && <circle className="bm-pulse" cx={x} cy={y} r="14" />}
            <circle className="bm-hit" cx={x} cy={y} r="16" />
            <circle className="bm-dot" cx={x} cy={y} r={selected === i ? 9 : 7} />
            <title>{`${names[i]} · ${statuses[i].label ?? STATUS[s].label}`}</title>
            {selected === i && <text className="bm-label" x={x > 120 ? x + 16 : x - 16} y={y + 4} textAnchor={x > 120 ? "start" : "end"}>{names[i].split(" ")[0].replace(",", "")}</text>}
          </g>
        })}
      </svg>
      <div className="body-map-overall"><small>Overall today</small><StatusChip status={overall} /></div>
    </div>
    <div className="body-map-side">
      <div className="body-map-focus">
        <span className="kicker">{active.hazard.toUpperCase()}</span>
        <h3>{names[selected]}</h3>
        <StatusChip status={active.status} label={active.label} />
        <p>{active.reason}</p>
        <p className="tier-line"><b>{STATUS[active.status].tier}:</b> {STATUS[active.status].action}</p>
      </div>
      <div className="body-map-list">{names.map((n, i) => <button key={n} className={selected === i ? "active" : ""} onClick={() => onSelect(i)}><i className={`dot st-${statuses[i].status}`} aria-hidden="true" />{n}<small>{statuses[i].label ?? STATUS[statuses[i].status].label}</small></button>)}</div>
    </div>
  </section>
}

export function OverallStatus({ onOpen }: { onOpen: (domain: number) => void }) {
  const statuses = useDomainStatuses()
  const names = ["Heart & circulation", "Immune", "Bone & muscle", "Mind", "Sleep", "Nutrition", "Radiation", "Breathing & cabin", "Vision & balance", "Pain"]
  const overall = worst(...statuses.map(s => s.status))
  const flagged = statuses.map((s, i) => ({ ...s, i })).filter(s => s.status === "watch" || s.status === "act" || s.status === "urgent").sort((a, b) => ["urgent", "act", "watch"].indexOf(a.status) - ["urgent", "act", "watch"].indexOf(b.status))
  const counts = (["good", "watch", "act", "urgent", "unknown"] as Status[]).map(s => [s, statuses.filter(x => x.status === s).length] as const).filter(([, n]) => n)
  return <section className={`overall-status st-${overall}`} aria-label="Overall health status">
    <div className="overall-top"><small>TODAY · MISSION DAY 147</small><StatusChip status={overall} label={overall === "good" ? "No concerns in what was measured" : STATUS[overall].label} /></div>
    <p className="overall-action"><b>{STATUS[overall].tier}.</b> {STATUS[overall].action}</p>
    <div className="overall-counts">{counts.map(([s, n]) => <span key={s} className={`st-${s}`}><i className={`dot st-${s}`} />{n} {STATUS[s].label.toLowerCase()}</span>)}</div>
    {flagged.length > 0 && <ul>{flagged.slice(0, 3).map(f => <li key={f.i}><button onClick={() => onOpen(f.i)}><i className={`dot st-${f.status}`} /><span><b>{names[f.i]}</b><small>{f.reason}</small></span><em>↗</em></button></li>)}</ul>}
  </section>
}

export function VitalsLog() {
  const m = useMission()
  const [form, setForm] = useState({ bpSys: "", bpDia: "", glucose: "", dose: "" })
  const [guide, setGuide] = useState<keyof typeof GUIDES>("bp")
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [formError, setFormError] = useState("")
  const v = m.vitals
  const rows = [
    { id: "bp", value: v.bpSys !== null ? `${v.bpSys}/${v.bpDia}` : "—", status: bpStatus(v.bpSys, v.bpDia) },
    { id: "glucose", value: v.glucose ?? "—", status: glucoseStatus(v.glucose) },
    { id: "temperature", value: m.signals.temperature, status: temperatureStatus(m.signals.temperature) },
    { id: "dose", value: v.dose ?? "—", status: doseStatus(v.dose) },
  ]
  const g = GUIDES[guide]
  const field = (key: keyof typeof form, label: string, placeholder: string, step = "1", min = "0") => <label>{label}<input inputMode="decimal" type="number" min={min} step={step} placeholder={placeholder} value={form[key]} aria-invalid={!!errors[key]} onChange={e => { setForm({ ...form, [key]: e.target.value }); setSaved(false); setErrors({ ...errors, [key]: undefined }); setFormError("") }} />{errors[key] && <span className="field-error">{errors[key]}</span>}</label>
  return <section className="vitals-log card mission-panel" id="vitals-log" aria-label="Log your measurements">
    <div className="vitals-head"><div><span className="kicker">MANUAL MEASUREMENTS</span><h3>Log a reading. See what it means.</h3></div><StatusLegend /></div>
    <div className="vitals-grid">
      <div className="vitals-form">
        <div className="vitals-fields">
          {field("bpSys", "Systolic BP (mmHg)", "118")}
          {field("bpDia", "Diastolic BP (mmHg)", "76")}
          {field("glucose", "Fasting blood sugar (mg/dL)", "90")}
          {field("dose", "Dosimeter today (mSv)", "1.8", "0.1")}
        </div>
        <button className="btn primary" onClick={() => {
          const check = validateVitals(form)
          setErrors(check.errors); setSaved(false)
          if (check.empty) return setFormError("Enter at least one reading to save.")
          if (Object.keys(check.errors).length) return setFormError("Check the highlighted values. Nothing was saved.")
          m.saveVitals(check.values)
          setForm({ bpSys: "", bpDia: "", glucose: "", dose: "" }); setFormError(""); setSaved(true)
        }}>Save readings</button>
        {formError && <p role="alert" className="form-error">{formError}</p>}
        {saved && <p role="status" className="saved-line">Saved to your mission record. Your body map and routine are updated.</p>}
        <div className="vitals-results">{rows.map(r => <button key={r.id} className={`vitals-result st-${r.status} ${guide === r.id ? "active" : ""}`} onClick={() => setGuide(r.id as keyof typeof GUIDES)}>
          <small>{GUIDES[r.id].name}</small><strong>{r.value}<span>{GUIDES[r.id].unit}</span></strong><StatusChip status={r.status} /><em>{STATUS[r.status].tier}</em>
        </button>)}</div>
      </div>
      <div className="vitals-guide" aria-live="polite">
        <div className="guide-tabs">{Object.entries(GUIDES).map(([id, x]) => <button key={id} className={guide === id ? "active" : ""} onClick={() => setGuide(id as keyof typeof GUIDES)}>{x.name}</button>)}</div>
        <span className="kicker">HAZARD · {g.hazard.toUpperCase()}</span>
        <h4>How to measure</h4><p>{g.how}</p>
        <h4>Why it matters in space</h4><p>{g.why}</p>
        <p className="guide-range">{g.range}</p>
        <div className="escalation">{(["watch", "act", "urgent"] as Status[]).map((s, i) => <div key={s} className={`st-${s}`}><span>0{i + 1}</span><b>{STATUS[s].tier}</b><small>{STATUS[s].action}</small></div>)}</div>
      </div>
    </div>
    <p className="fine-print">Ranges follow general adult guidance for demonstration. A mission's flight surgeons set each crew member's limits.</p>
  </section>
}

export function DailyRoutine({ onLog }: { onLog: () => void }) {
  const m = useMission()
  const done = m.routineDone
  const total = ROUTINE.reduce((a, r) => a + r.points, 0)
  const points = ROUTINE.filter(r => done.includes(r.id)).reduce((a, r) => a + r.points, 0)
  const complete = ROUTINE.every(r => done.includes(r.id))
  const streak = m.streak + (complete ? 1 : 0)
  const next = ROUTINE.find(r => !done.includes(r.id))
  const badges = [
    { name: "First reading", earned: !!m.vitals.at, hint: "Log a measurement" },
    { name: "Full orbit", earned: complete, hint: "Finish today's routine" },
    { name: "Week strong", earned: streak >= 7, hint: "7-day streak" },
  ]
  const r = 46, c = 2 * Math.PI * r
  return <section className="daily-routine" aria-label="Today's health routine">
    <div className="routine-score">
      <svg className="routine-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r={r} className="ring-bg" /><circle cx="60" cy="60" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - points / total)} /></svg>
      <div className="routine-points"><strong>{points}</strong><small>/ {total} pts</small></div>
      <p>{streak ? <><b>{streak}-day</b> streak{complete ? " · today counted" : ""}</> : "Finish today's routine to start a streak"}</p>
      <div className="badges">{badges.map(b => <span key={b.name} className={b.earned ? "earned" : ""} title={b.earned ? "Earned" : b.hint}>{b.earned ? "★" : "☆"} {b.name}</span>)}</div>
    </div>
    <div className="routine-list">
      <div className="routine-head"><div><span className="kicker">TODAY'S ROUTINE</span><h2>Small tasks, steady health.</h2></div>{next && <span className="next-up">Next · {next.time} {next.label}</span>}</div>
      <ul>{ROUTINE.map(item => {
        const ok = done.includes(item.id), measure = ["bp", "glucose", "dose"].includes(item.id)
        return <li key={item.id} className={ok ? "done" : ""}>
          <label><input type="checkbox" checked={ok} onChange={() => m.toggleRoutine(item.id)} /><span className="tick" aria-hidden="true">✓</span><time>{item.time}</time><span>{item.label}</span></label>
          <em>+{item.points}</em>{measure && !ok && <button onClick={onLog}>Log ↗</button>}
        </li>
      })}</ul>
    </div>
  </section>
}

type MetricKey = "pulse" | "hrv" | "sleep" | "temperature" | "bp" | "glucose" | "oxygen" | "dose"
const METRICS: Record<MetricKey, { label: string; unit: string; band: [number, number]; status: (v: number) => Status }> = {
  pulse: { label: "Heart rate", unit: "bpm", band: [54, 74], status: v => pulseStatus(v, (v - 64) / 5) },
  hrv: { label: "HRV", unit: "ms", band: [32, 64], status: v => (v < 32 ? "watch" : "good") },
  sleep: { label: "Sleep", unit: "h", band: [7, 9], status: sleepStatus },
  temperature: { label: "Temperature", unit: "°C", band: [36.1, 37.2], status: temperatureStatus },
  bp: { label: "Blood pressure", unit: "mmHg", band: [90, 119], status: v => bpStatus(v, 70) },
  glucose: { label: "Blood sugar", unit: "mg/dL", band: [70, 99], status: glucoseStatus },
  oxygen: { label: "SpO₂", unit: "%", band: [95, 100], status: oxygenStatus },
  dose: { label: "Radiation", unit: "mSv", band: [0, 2.5], status: doseStatus },
}

export function TrendChart() {
  const m = useMission()
  const [metric, setMetric] = useState<MetricKey>("pulse")
  const [range, setRange] = useState(14)
  const cfg = METRICS[metric]
  const now: Record<MetricKey, number | null> = { pulse: m.signals.pulse, hrv: m.signals.hrv, sleep: m.signals.sleep, temperature: m.signals.temperature, bp: m.vitals.bpSys, glucose: m.vitals.glucose, oxygen: m.signals.oxygen, dose: m.vitals.dose }
  const rows = [
    ...sampleHistory.slice(-range, -1).map(r => ({ d: `D${r.day}`, v: metric === "bp" ? r.bpSys : r[metric], v2: metric === "bp" ? r.bpDia : undefined })),
    { d: "Now", v: now[metric], v2: metric === "bp" ? m.vitals.bpDia ?? undefined : undefined },
  ]
  const values = rows.map(r => r.v).filter((x): x is number => x !== null)
  const current = now[metric]
  const status: Status = metric === "bp" ? bpStatus(m.vitals.bpSys, m.vitals.bpDia) : current === null ? "unknown" : cfg.status(current)
  const avg = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null
  const rowStatus = (r: { v: number | null; v2?: number }) => r.v === null ? "unknown" : metric === "bp" ? bpStatus(r.v, r.v2 ?? null) : cfg.status(r.v)
  const flagged = rows.filter(r => r.v !== null && rowStatus(r) !== "good").length
  const pad = (cfg.band[1] - cfg.band[0]) * 0.6
  const lo = Math.min(cfg.band[0] - pad, ...values, ...(metric === "bp" ? rows.map(r => r.v2 ?? 999) : [])), hi = Math.max(cfg.band[1] + pad, ...values)
  // Area dots receive a [base, value] pair, so colour from the row itself.
  const Dot = (p: any) => p.cy == null || p.payload?.v == null ? <g key={p.index} /> : <circle key={p.index} cx={p.cx} cy={p.cy} r={p.index === rows.length - 1 ? 6 : 3.5} className={`trend-dot st-${rowStatus(p.payload)}`} />
  return <section className="trend-panel card mission-panel" aria-label={`${cfg.label} trend`}>
    <div className="trend-head">
      <div><span className="kicker">TREND · {range} DAYS</span><h3>{cfg.label}</h3></div>
      <div className="metric-pills">{[7, 14, 30].map(d => <button key={d} className={range === d ? "active" : ""} onClick={() => setRange(d)}>{d}d</button>)}</div>
    </div>
    <div className="metric-pills trend-metrics">{(Object.keys(METRICS) as MetricKey[]).map(k => <button key={k} className={metric === k ? "active" : ""} onClick={() => setMetric(k)}>{METRICS[k].label}</button>)}</div>
    <div className="trend-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs><linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c9a9f0" stopOpacity=".28" /><stop offset="1" stopColor="#c9a9f0" stopOpacity="0" /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="rgba(214,190,235,.08)" />
          <ReferenceArea y1={cfg.band[0]} y2={cfg.band[1]} fill="#7fd1a8" fillOpacity={0.09} stroke="#7fd1a8" strokeOpacity={0.25} strokeDasharray="4 5" label={{ value: "Your range", position: "insideTopLeft", fill: "#9fdcbc", fontSize: 11 }} />
          <XAxis dataKey="d" tick={{ fill: "#a993ba", fontSize: 11 }} tickLine={false} axisLine={false} interval={range > 14 ? 4 : range > 7 ? 1 : 0} />
          <YAxis domain={[Math.floor(lo), Math.ceil(hi)]} tick={{ fill: "#a993ba", fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip contentStyle={{ background: "#2a1f36", border: "1px solid #d3aede40", borderRadius: 12, color: "#f5ebfb" }} labelStyle={{ color: "#cdb8dc" }} formatter={(v: any, n: any) => [`${v} ${cfg.unit}`, n]} />
          <Area type="monotone" dataKey="v" name={metric === "bp" ? "Systolic" : cfg.label} stroke="#c9a9f0" strokeWidth={2.6} fill="url(#trend-area)" dot={Dot} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive />
          {metric === "bp" && <Line type="monotone" dataKey="v2" name="Diastolic" stroke="#8fb8e6" strokeWidth={2} dot={false} strokeDasharray="5 4" />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    <div className="trend-readouts">
      <div><small>Now</small><strong>{metric === "bp" ? (m.vitals.bpSys !== null ? `${m.vitals.bpSys}/${m.vitals.bpDia}` : "—") : current ?? "—"} <span>{cfg.unit}</span></strong><StatusChip status={status} label={current === null ? "Not logged today" : undefined} /></div>
      <div><small>{range}-day average</small><strong>{avg ?? "—"} <span>{cfg.unit}</span></strong></div>
      <div><small>Your range</small><strong>{cfg.band[0]}–{cfg.band[1]} <span>{cfg.unit}</span></strong></div>
      <div><small>Days outside range</small><strong>{flagged}<span> of {values.length}</span></strong></div>
    </div>
    <p className="fine-print">Past days are fictional sample records. "Now" uses your current simulation and the readings you log.</p>
  </section>
}
