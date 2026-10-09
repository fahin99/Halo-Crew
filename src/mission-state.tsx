import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react"
export const scenarios = [
  "Nominal",
  "Recovery shift",
  "Poor contact",
  "Immune review",
  "Exercise gap",
  "Habitat alert",
] as const
export type Scenario = typeof scenarios[number]
export const wearableNames = ["Bioglove", "Bioglass", "ECG wearable", "Exercise sensor", "Bone-scan attachment", "Pocket biomarker reader"] as const
export function connectionSummary(connections: boolean[]) {
 const count=connections.filter(Boolean).length;
 return {count,total:wearableNames.length,label:count===0?"Not connected":count===wearableNames.length?"Connected":"Partially connected"};
}
export type Entry = {
  id: string
  at: string
  type: string
  text: string
  synced: boolean
}
type Checkin = { mood: string; fatigue: number; pain: string; symptoms: string }
type State = {
  scenario: Scenario
  connections: boolean[]
  checkin: Checkin
  logs: Entry[]
  offline: boolean
  approved: string[]
  exerciseExtra: number
  evidence: Record<string,string>
  stock: Record<string, number>
}
const initial: State = {
  connections: wearableNames.map(()=>false),
  exerciseExtra: 0,
  evidence: {},
  scenario: "Nominal",
  checkin: { mood: "Calm", fatigue: 3, pain: "None", symptoms: "" },
  logs: [],
  offline: false,
  approved: [],
  stock: {
    "Oral rehydration supplies": 12,
    "Wound-care packs": 8,
    "Crew-prescribed medication": 6,
  },
}
const KEY = "halo-mission-demo-v2"
function read(): State {
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || "null")
    if (x && scenarios.includes(x.scenario) && Array.isArray(x.logs))
      return { ...initial, ...x, logs: x.logs.map((entry: Entry) => ({...entry, type: entry.type.replace(/\bdemo\b/gi, "sample"), text: entry.text.replace(/\bdemo\b/gi, "sample")})) }
  } catch {}
  return initial
}
export function getSignals(s: Scenario) {
  const shifted = s === "Recovery shift",
    poor = s === "Poor contact",
    immune = s === "Immune review",
    exercise = s === "Exercise gap",
    habitat = s === "Habitat alert"
  return {
    pulse: poor ? null : shifted ? 88 : 64,
    hrv: poor ? null : shifted ? 28 : 48,
    oxygen: poor ? null : 98,
    sleep: shifted ? 5.2 : 7.3,
    temperature: immune ? 38.1 : 36.7,
    sessions: exercise ? 3 : 6,
    planned: 7,
    co2: habitat ? 2800 : 850,
    quality: poor ? "Unreliable" : "Good",
    immuneResult: immune
      ? "Scheduled test pending"
      : "No current laboratory result",
    radiation: "No dosimeter connected",
    signalSource: "Synthetic mission scenario",
  }
}
export function calculate(s: Scenario, fatigue: number, completed?: number) {
  const v = getSignals(s)
  if(completed!==undefined)v.sessions=completed
  const sleep = Math.min(100, Math.max(0, ((8 - v.sleep) / 8) * 100))
  const exercise = (1 - v.sessions / v.planned) * 100
  const load = Math.round(0.5 * sleep + 0.3 * fatigue * 10 + 0.2 * exercise)
  return {
    load,
    sleep: Math.round(sleep),
    fatigue: fatigue * 10,
    exercise: Math.round(exercise),
    adherence: Math.round((v.sessions / v.planned) * 100),
    pulseZ:
      v.pulse === null ? null : Math.round(((v.pulse - 64) / 5) * 10) / 10,
    hrvZ: v.hrv === null ? null : Math.round(((v.hrv - 48) / 8) * 10) / 10,
  }
}
export function assessment(s: Scenario) {
  switch (s) {
    case "Poor contact":
      return {
        title: "Signal needs a recheck",
        body: "Contact quality is insufficient. Pulse, HRV and oxygen interpretation are withheld.",
        action: "Repeat sensor contact check",
        tone: "attention",
      }
    case "Recovery shift":
      return {
        title: "Recovery pattern changed",
        body: "Synthetic sleep is shorter and resting pulse is above the training reference. Add symptoms and review recovery support.",
        action: "Complete check-in and take a recovery break",
        tone: "attention",
      }
    case "Immune review":
      return {
        title: "Temperature and symptoms need review",
        body: "The scenario includes an elevated measured temperature. Immune status remains unknown without appropriate tests.",
        action: "Request medical review and track sample collection",
        tone: "attention",
      }
    case "Exercise gap":
      return {
        title: "Bone-protection plan has a gap",
        body: "Three of seven scheduled resistance sessions are complete. Bone density has not been measured in this sample.",
        action: "Review the prescribed exercise plan",
        tone: "attention",
      }
    case "Habitat alert":
      return {
        title: "Review the shared habitat",
        body: "The synthetic cabin CO₂ reading crossed this sample’s configured review threshold. Follow mission procedures.",
        action: "Notify crew and request habitat review",
        tone: "attention",
      }
    default:
      return {
        title: "Available readings are near your personal reference",
        body: "Available simulated readings are near the training reference. Unmeasured health domains remain unknown.",
        action: "Complete your daily check-in",
        tone: "good",
      }
  }
}
type Mission = State & {
  healthState: Scenario
  signals: ReturnType<typeof getSignals>
  scores: ReturnType<typeof calculate>
  notice: ReturnType<typeof assessment>
  storageError: boolean
  backendStatus: string
  setScenario: (s: Scenario) => void
  saveCheckin: (c: Checkin) => void
  log: (type: string, text: string) => void
  setOffline: (v: boolean) => void
  sync: () => void
  approve: (id: string) => void
  useStock: (id: string) => void
  completeExercise: () => void
  saveEvidence: (kind:string,value:string)=>void
  clearApprovals: () => void
  reset: () => void
}
const Context = createContext<Mission | null>(null)
export function MissionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(read)
  const [storageError, setError] = useState(false)
  const [backendStatus, setBackendStatus] = useState("Connecting to local record service")
  const [hydrated, setHydrated] = useState(false)
  const saveQueue = useRef(Promise.resolve())
  useEffect(() => {
    let cancelled = false
    fetch("/api/mission").then(r=>{if(!r.ok)throw new Error();return r.json()}).then(data=>{
      if(cancelled)return
      if(!read().offline && data.state && scenarios.includes(data.state.scenario) && Array.isArray(data.state.logs))setState({...initial,...data.state})
      setBackendStatus("Mission server connected")
    }).catch(()=>{if(!cancelled)setBackendStatus("Browser storage · server unavailable")}).finally(()=>{if(!cancelled)setHydrated(true)})
    return ()=>{cancelled=true}
  }, [])
  useEffect(()=>{
    if(!hydrated || state.offline)return
    const timer=setTimeout(()=>{
      saveQueue.current=saveQueue.current.catch(()=>{}).then(async()=>{
        const response=await fetch("/api/mission",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(state)})
        if(!response.ok)throw new Error()
        setBackendStatus("Saved to mission server")
      }).catch(()=>setBackendStatus("Browser storage · server unavailable"))
    },300)
    return ()=>clearTimeout(timer)
  },[state,hydrated])
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
      setError(false)
    } catch {
      setError(true)
    }
  }, [state])
  const entry = (type: string, text: string): Entry => ({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    type,
    text,
    synced: false,
  })
  const log = (type: string, text: string) =>
    setState((s) => ({
      ...s,
      logs: [entry(type, text), ...s.logs].slice(0, 200),
    }))
  const signals=getSignals(state.scenario);
  signals.sessions=Math.min(signals.planned,signals.sessions+state.exerciseExtra);
  if(state.evidence["Immune laboratory result"])signals.immuneResult=state.evidence["Immune laboratory result"];
  const notice=assessment(state.scenario);
  if(state.scenario==="Exercise gap")notice.body=`${signals.sessions} of ${signals.planned} sample resistance sessions are complete. Bone density has not been measured.`;
  if(state.scenario==="Nominal" && (state.checkin.fatigue>=7 || ["Stressed","Low"].includes(state.checkin.mood))){notice.title="Your check-in deserves attention";notice.body=`You reported ${state.checkin.mood.toLowerCase()} mood and fatigue ${state.checkin.fatigue}/10. Choose support and record how you respond; self-report is not a diagnosis.`;notice.action="Choose support and record follow-up";notice.tone="attention";}
  if(state.scenario==="Exercise gap" && signals.sessions===signals.planned){notice.title="Exercise plan completed in the sample";notice.body="Seven of seven sample sessions are logged. Bone density and biomarkers still require appropriate measurement.";notice.action="Record exercise follow-up";notice.tone="good";}
  if(state.checkin.pain==="Severe"){notice.title="Severe discomfort needs medical review";notice.body="Your self-report takes priority over reassuring sample readings. Use the mission medical evaluation pathway.";notice.action="Request medical review";notice.tone="attention";}
  const healthState: Scenario = signals.quality === "Unreliable" ? "Poor contact" : signals.temperature >= 38 ? "Immune review" : signals.co2 >= 2000 ? "Habitat alert" : signals.sessions < 4 ? "Exercise gap" : signals.sleep < 6 || state.checkin.fatigue >= 7 || ["Stressed","Low"].includes(state.checkin.mood) ? "Recovery shift" : "Nominal";
  const value: Mission = {
    healthState,
    ...state,
    signals,
    scores: calculate(state.scenario, state.checkin.fatigue, signals.sessions),
    notice,
    storageError,
    backendStatus,
    setScenario: (scenario) => setState((s) => ({ ...s, scenario,exerciseExtra:0 })),
    saveCheckin: (checkin) =>
      setState((s) => ({
        ...s,
        checkin,
        logs: [
          entry(
            "Check-in",
            `${checkin.mood}; fatigue ${checkin.fatigue}/10; pain ${checkin.pain}; symptoms ${checkin.symptoms || "none reported"}`,
          ),
          ...s.logs,
        ].slice(0, 200),
      })),
    log,
    setOffline: (offline) => setState((s) => ({ ...s, offline })),
    sync: () => {
      if(state.offline)return
      setBackendStatus("Transferring records to mission inbox")
      fetch("/api/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({logs:state.logs})}).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(data=>{
        setState(s=>({...s,logs:s.logs.map(l=>data.ids.includes(l.id)?{...l,synced:true}:l)}))
        setBackendStatus("Records delivered to mission inbox")
      }).catch(()=>setBackendStatus("Transfer failed · records remain queued"))
    },
    approve: (id) =>
      setState((s) => ({
        ...s,
        approved: [...new Set([...s.approved, id])],
        logs: [
          entry(
            "Sample review",
            `Simulated medical officer review completed for ${id}. Not real clinical authorization.`,
          ),
          ...s.logs,
        ],
      })),
    useStock: (id) =>
      setState((s) =>
        !s.approved.includes(id) || s.stock[id] < 1
          ? s
          : {
              ...s,
              stock: { ...s.stock, [id]: s.stock[id] - 1 },
              approved: s.approved.filter((a) => a !== id),
              logs: [
                entry(
                  "Kit use",
                  `Sample inventory: one ${id} item logged. No drug dose recommended.`,
                ),
                ...s.logs,
              ],
            },
      ),
    completeExercise: ()=>setState(s=>{const base=getSignals(s.scenario);if(base.sessions+s.exerciseExtra>=base.planned)return s;return {...s,exerciseExtra:s.exerciseExtra+1,logs:[entry("Exercise completed","One prescribed session logged by the presenter; load data remains simulated. Bone density is not inferred."),...s.logs].slice(0,200)}}),
    saveEvidence:(kind,text)=>setState(s=>({...s,evidence:{...s.evidence,[kind]:text},logs:[entry("Manual evidence",`${kind}: ${text}. Presenter-entered sample record, not verified laboratory/device data.`),...s.logs].slice(0,200)})),
    clearApprovals: () => setState((s) => ({ ...s, approved: [] })),
    reset: () => setState({ ...initial, logs: [] }),
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useMission() {
  const m = useContext(Context)
  if (!m) throw new Error("Mission provider missing")
  return m
}
