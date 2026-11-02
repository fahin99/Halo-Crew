// Status ranges, escalation tiers and measurement guidance shared by the health views.
// Ranges follow common adult reference guidance and are illustrative; they are not mission clinical limits.

export type Status = "good" | "watch" | "act" | "urgent" | "unknown"
// Each measurement keeps its own timestamp so an old value is never shown as today's.
export type Vitals = { bpSys: number | null; bpDia: number | null; bpAt: string | null; glucose: number | null; glucoseAt: string | null; dose: number | null; doseAt: string | null }
export const emptyVitals: Vitals = { bpSys: null, bpDia: null, bpAt: null, glucose: null, glucoseAt: null, dose: null, doseAt: null }

export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const isToday = (at: string | null) => !!at && localDay(new Date(at)) === localDay()
// Only today's readings count toward current status; older ones remain as history.
export const freshVitals = (v: Vitals): Vitals => ({
  ...v,
  bpSys: isToday(v.bpAt) ? v.bpSys : null, bpDia: isToday(v.bpAt) ? v.bpDia : null,
  glucose: isToday(v.glucoseAt) ? v.glucose : null,
  dose: isToday(v.doseAt) ? v.dose : null,
})
export function ageLabel(at: string | null) {
  if (!at) return "Never logged"
  const d = new Date(at)
  if (isToday(at)) return `Today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  const days = Math.round((new Date(localDay()).getTime() - new Date(localDay(d)).getTime()) / 86400000)
  return days === 1 ? "Yesterday · log today's reading" : `${days} days ago · log today's reading`
}
// Records saved before per-reading timestamps shared one `at` field.
export function migrateVitals(v: any): Vitals {
  if (!v || typeof v !== "object") return emptyVitals
  const { at = null, ...rest } = v
  return { ...emptyVitals, ...rest, bpAt: v.bpAt ?? (v.bpSys != null ? at : null), glucoseAt: v.glucoseAt ?? (v.glucose != null ? at : null), doseAt: v.doseAt ?? (v.dose != null ? at : null) }
}

const rank: Record<Status, number> = { unknown: 0, good: 1, watch: 2, act: 3, urgent: 4 }
export const worst = (...list: Status[]) => list.reduce((a, b) => (rank[b] > rank[a] ? b : a), "unknown" as Status)

export const STATUS: Record<Status, { label: string; tier: string; action: string; mark: string }> = {
  good: { label: "In range", tier: "Keep going", action: "Within your range. Keep your routine.", mark: "●" },
  watch: { label: "Watch", tier: "Self-care", action: "Follow HALO's self-care guidance and recheck later today.", mark: "▲" },
  act: { label: "Act today", tier: "Crew Medical Officer", action: "Tell your Crew Medical Officer today and log what you notice.", mark: "◆" },
  urgent: { label: "Urgent", tier: "CMO + flight surgeon", action: "Contact your Crew Medical Officer now. A flight surgeon consult follows, allowing for the signal delay.", mark: "■" },
  unknown: { label: "Not measured", tier: "Measure", action: "No reading yet. Take the measurement to see your status.", mark: "○" },
}

export const HAZARDS = {
  radiation: "Space radiation",
  isolation: "Isolation & confinement",
  distance: "Distance from Earth",
  gravity: "Gravity fields",
  environment: "Hostile closed environment",
} as const

export function bpStatus(sys: number | null, dia: number | null): Status {
  if (sys === null || dia === null) return "unknown"
  if (sys >= 180 || dia >= 120) return "urgent"
  if (sys >= 140 || dia >= 90) return "act"
  if (sys >= 120 || dia >= 80 || sys < 90 || dia < 60) return "watch"
  return "good"
}
export function glucoseStatus(v: number | null): Status {
  if (v === null) return "unknown"
  if (v < 54 || v >= 250) return "urgent"
  if (v >= 126) return "act"
  if (v < 70 || v >= 100) return "watch"
  return "good"
}
export function temperatureStatus(v: number | null): Status {
  if (v === null) return "unknown"
  if (v < 35 || v >= 39.5) return "urgent"
  if (v >= 38) return "act"
  if (v < 36.1 || v >= 37.3) return "watch"
  return "good"
}
export function oxygenStatus(v: number | null): Status {
  if (v === null) return "unknown"
  if (v < 88) return "urgent"
  if (v < 92) return "act"
  if (v < 95) return "watch"
  return "good"
}
export function pulseStatus(v: number | null, z: number | null): Status {
  if (v === null) return "unknown"
  if (v > 120 || v < 40) return "urgent"
  if (v > 100) return "act"
  if (z !== null && Math.abs(z) >= 2) return "watch"
  return "good"
}
export function sleepStatus(h: number | null): Status {
  if (h === null) return "unknown"
  if (h < 4.5) return "act"
  if (h < 7) return "watch"
  return "good"
}
export function co2Status(ppm: number | null): Status {
  if (ppm === null) return "unknown"
  if (ppm >= 5000) return "urgent"
  if (ppm >= 2000) return "act"
  return "good"
}
// Deep-space cruise is roughly 1.8 mSv/day (MSL RAD); a sharp rise suggests a solar particle event.
export function doseStatus(mSv: number | null): Status {
  if (mSv === null) return "unknown"
  if (mSv >= 20) return "urgent"
  if (mSv >= 5) return "act"
  if (mSv > 2.5) return "watch"
  return "good"
}

// Plausible input bounds; values outside them are almost certainly typing errors.
export function validateVitals(f: { bpSys: string; bpDia: string; glucose: string; dose: string }) {
  const errors: Partial<Record<keyof typeof f, string>> = {}
  const num = (v: string) => (v.trim() === "" ? null : Number(v))
  const sys = num(f.bpSys), dia = num(f.bpDia), glucose = num(f.glucose), dose = num(f.dose)
  const bad = (v: number | null, lo: number, hi: number) => v !== null && (!Number.isFinite(v) || v < lo || v > hi)
  if ((sys === null) !== (dia === null)) errors[sys === null ? "bpSys" : "bpDia"] = "Enter both blood pressure numbers"
  if (bad(sys, 60, 260)) errors.bpSys = "Systolic must be 60–260 mmHg"
  if (bad(dia, 30, 160)) errors.bpDia = "Diastolic must be 30–160 mmHg"
  if (!errors.bpSys && !errors.bpDia && sys !== null && dia !== null && dia >= sys) errors.bpDia = "Diastolic must be lower than systolic"
  if (bad(glucose, 20, 600)) errors.glucose = "Blood sugar must be 20–600 mg/dL"
  if (bad(dose, 0, 100)) errors.dose = "Dose must be 0–100 mSv"
  const empty = sys === null && dia === null && glucose === null && dose === null
  return { errors, empty, values: { bpSys: sys, bpDia: dia, glucose, dose } }
}

export const GUIDES: Record<string, { name: string; unit: string; how: string; why: string; hazard: string; range: string }> = {
  bp: {
    name: "Blood pressure", unit: "mmHg",
    how: "Rest quietly for 5 minutes. Cuff on the bare upper arm at heart level, feet secured. Take two readings a minute apart and log the average.",
    why: "In microgravity, fluids shift toward the head and the heart and vessels adapt. Blood pressure control can change, and fainting on return to gravity is a known risk.",
    hazard: HAZARDS.gravity, range: "In range below 120/80 · Act at 140/90 or higher",
  },
  glucose: {
    name: "Blood sugar", unit: "mg/dL",
    how: "Before breakfast. Clean the fingertip, use a fresh glucometer strip and log the value in mg/dL.",
    why: "Lower physical load, a packaged diet and stress hormones can change how the body handles glucose on long missions.",
    hazard: HAZARDS.gravity, range: "In range 70–99 fasting · Act at 126 or higher",
  },
  temperature: {
    name: "Body temperature", unit: "°C",
    how: "Under the tongue for one minute. Avoid measuring right after exercise or a hot drink.",
    why: "The immune system changes in spaceflight. A fever can be an early sign of infection in a closed cabin where germs spread easily.",
    hazard: HAZARDS.environment, range: "In range 36.1–37.2 · Act at 38.0 or higher",
  },
  dose: {
    name: "Radiation dose", unit: "mSv / day",
    how: "Read your personal dosimeter at the same time each day and log today's dose.",
    why: "Beyond Earth's magnetic field, cosmic rays and solar particle events raise long-term cancer and tissue risks. NASA's career limit is 600 mSv.",
    hazard: HAZARDS.radiation, range: "Cruise ≈ 1.8 mSv/day · Shelter guidance above 20",
  },
}

type Inputs = {
  signals: { pulse: number | null; oxygen: number | null; sleep: number; temperature: number; sessions: number; planned: number; co2: number }
  pulseZ: number | null
  checkin: { mood: string; fatigue: number; pain: string; symptoms: string }
  vitals: Vitals
}
// One status per health domain, in the same order as the Health Overview domains.
// `label` names what was actually observed when a domain is judged from a proxy, not a direct test.
export function domainStatuses({ signals, pulseZ, checkin, vitals }: Inputs): { status: Status; reason: string; hazard: string; label?: string }[] {
  const adherence = signals.sessions / signals.planned
  const lowMood = ["Stressed", "Low"].includes(checkin.mood)
  const bp = bpStatus(vitals.bpSys, vitals.bpDia)
  const pulse = pulseStatus(signals.pulse, pulseZ)
  return [
    { status: worst(pulse, bp), reason: signals.pulse === null ? "Pulse withheld: sensor contact failed" : `Pulse ${signals.pulse} bpm${vitals.bpSys ? ` · BP ${vitals.bpSys}/${vitals.bpDia}` : " · BP not logged"}`, hazard: HAZARDS.gravity },
    (() => { const s = worst(temperatureStatus(signals.temperature), checkin.symptoms.trim() ? "watch" : "good"); return { status: s, label: s === "good" ? "No fever or symptoms" : undefined, reason: `Temperature ${signals.temperature} °C${checkin.symptoms.trim() ? " · symptoms reported" : ""} · immune function not measured`, hazard: HAZARDS.environment } })(),
    { status: adherence >= 0.85 ? "good" : "watch", label: adherence >= 0.85 ? "Exercise on plan" : "Exercise behind plan", reason: `${signals.sessions}/${signals.planned} resistance sessions this week · bone density not measured`, hazard: HAZARDS.gravity },
    { status: lowMood && checkin.fatigue >= 8 ? "act" : lowMood || checkin.fatigue >= 7 ? "watch" : "good", label: lowMood || checkin.fatigue >= 7 ? undefined : "Check-in steady", reason: `Mood ${checkin.mood.toLowerCase()} · fatigue ${checkin.fatigue}/10`, hazard: HAZARDS.isolation },
    { status: sleepStatus(signals.sleep), reason: `${signals.sleep} h last night · target 7–8 h`, hazard: HAZARDS.isolation },
    { status: glucoseStatus(vitals.glucose), reason: vitals.glucose === null ? "Fasting blood sugar not logged" : `Fasting blood sugar ${vitals.glucose} mg/dL`, hazard: HAZARDS.distance },
    { status: doseStatus(vitals.dose), reason: vitals.dose === null ? "Dosimeter reading not logged" : `${vitals.dose} mSv today`, hazard: HAZARDS.radiation },
    { status: worst(co2Status(signals.co2), oxygenStatus(signals.oxygen)), reason: `Cabin CO₂ ${signals.co2} ppm · SpO₂ ${signals.oxygen ?? "withheld"}`, hazard: HAZARDS.environment },
    { status: "unknown", reason: "No vision or balance assessment this week", hazard: HAZARDS.gravity },
    { status: ({ None: "good", Mild: "watch", Moderate: "act", Severe: "urgent" } as Record<string, Status>)[checkin.pain] ?? "unknown", reason: `Pain: ${checkin.pain.toLowerCase()}`, hazard: HAZARDS.distance },
  ]
}

export const ROUTINE = [
  { id: "bp", time: "07:30", label: "Blood pressure", points: 10 },
  { id: "glucose", time: "07:35", label: "Fasting blood sugar", points: 10 },
  { id: "dose", time: "09:00", label: "Dosimeter reading", points: 10 },
  { id: "exercise", time: "14:00", label: "Resistance session", points: 20 },
  { id: "hydrate", time: "All day", label: "Drink 2.5 L of water", points: 10 },
  { id: "checkin", time: "20:00", label: "Daily check-in", points: 10 },
  { id: "winddown", time: "21:30", label: "Screen-free wind-down", points: 10 },
] as const
