import PageAtmosphere from "./PageAtmosphere"
import { Explore, SectionNavigator, type Destination } from "./Experience"
import {useEffect, useState, type ReactNode} from "react"
import { HardwareLab, Roadmap } from "./HealthLab"
import { MissionProvider, useMission, connectionSummary } from "./mission-state"
import {
  DemoControls,
  DemoHome,
  DemoHealth,
  DemoInsights,
  DemoWellbeing,
  DemoSupport,
  DemoFuture,
  DemoMedical,
  DemoFamily,
  DemoCopilot,
  DemoHandoff,
  DemoPrivacy,
  DemoSettings,
} from "./DemoMission"

type Page = "home" | "wellbeing" | "insights" | "why" | "future" | "support" | "family" | "crew" | "mission" | "copilot" | "model" | "history" | "privacy" | "settings" | "hardware" | "health" | "roadmap" | "medical" | "handoff"
type IconName = "home" | "heart" | "spark" | "future" | "support" | "family" | "crew" | "mission" | "chat" | "model" | "history" | "shield" | "settings" | "moon" | "sun" | "bell" | "arrow" | "play" | "pause" | "check" | "leaf" | "music" | "video" | "photo" | "audio" | "lock" | "eye" | "clock" | "close" | "menu" | "pulse" | "drop" | "wave" | "phone" | "micoff"

const EARTH_IMAGE =
  "https://images.unsplash.com/photo-1634176866089-b633f4aec882?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=82&w=1600"

const NAV: { id: Page; label: string; icon: IconName; group?: string }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "health", label: "Health Overview", icon: "heart" },
  { id: "hardware", label: "Hardware Studio", icon: "model" },
  { id: "wellbeing", label: "My Wellbeing", icon: "heart" },
  { id: "insights", label: "Insights", icon: "spark" },
  { id: "future", label: "Future Self", icon: "future" },
  { id: "support", label: "Support", icon: "support" },
  { id: "medical", label: "Medical Kit", icon: "pulse" },
  { id: "handoff", label: "Mission Record", icon: "history" },
  { id: "family", label: "Family", icon: "family", group: "CONNECTION" },
  { id: "crew", label: "Crew", icon: "crew" },
  { id: "mission", label: "Mission", icon: "mission" },
  { id: "copilot", label: "AI Copilot", icon: "chat", group: "HALO" },
  { id: "roadmap", label: "What’s Next", icon: "future" },
]

const PAGE_TITLES: Record<Page, string> = {
  medical: "Medical Kit",
  handoff: "Mission Record",
  hardware: "Hardware Studio",
  health: "Health Overview",
  roadmap: "What’s Next",
  home: "Home",
  wellbeing: "My Wellbeing",
  insights: "Insights",
  why: "Why?",
  future: "Future Self",
  support: "Support",
  family: "Family",
  crew: "Crew",
  mission: "Mission",
  copilot: "AI Copilot",
  model: "My Personal Model",
  history: "What Works For Me",
  privacy: "Privacy",
  settings: "Settings",
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-7h6v7" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    spark: (
      <>
        <path d="m12 3-1.4 4.1a5.4 5.4 0 0 1-3.5 3.5L3 12l4.1 1.4a5.4 5.4 0 0 1 3.5 3.5L12 21l1.4-4.1a5.4 5.4 0 0 1 3.5-3.5L21 12l-4.1-1.4a5.4 5.4 0 0 1-3.5-3.5Z" />
      </>
    ),
    future: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    support: (
      <>
        <path d="M6 8a6 6 0 0 1 12 0v5a3 3 0 0 1-3 3h-1" />
        <path d="M6 9H4v5h2m12-5h2v5h-2M9 19h6" />
      </>
    ),
    family: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2" />
        <path d="M3 20c0-4 2-7 6-7s6 3 6 7m0-6c3 0 5 2 5 5" />
      </>
    ),
    crew: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="7" r="2.5" />
        <path d="M2 20c0-4 2-7 6-7s6 3 6 7m1-7c4 0 6 2 6 6" />
      </>
    ),
    mission: (
      <>
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="9" />
        <path d="M3.5 15.5c5 2.2 12 1 17-4" />
      </>
    ),
    chat: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8m-8 4h5" />
      </>
    ),
    model: (
      <>
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="12" r="7" />
        <path d="M12 3V1m0 22v-2M3 12H1m22 0h-2" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5m4-2v6l4 2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    moon: (
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14m-5-5 5 5-5 5" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7Z" />,
    pause: (
      <>
        <path d="M9 5v14m6-14v14" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    leaf: (
      <>
        <path d="M4 20c5-1 9-5 12-12" />
        <path d="M6 15C2 8 8 3 20 4c1 12-7 16-14 11Z" />
      </>
    ),
    music: (
      <>
        <path d="M9 18V5l10-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="5" width="13" height="14" rx="2" />
        <path d="m16 10 5-3v10l-5-3" />
      </>
    ),
    photo: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m3 17 5-5 4 4 3-3 6 6" />
      </>
    ),
    audio: (
      <>
        <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
        <path d="M19 11v1a7 7 0 0 1-14 0v-1m7 8v3" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    pulse: <path d="M3 12h4l2.5-7 4.5 14 2.5-7H21" />,
    drop: <path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z" />,
    wave: <path d="M2 12c2-7 4-7 6 0s4 7 6 0 4-7 6 0" />,
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" />
    ),
    micoff: (
      <>
        <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
        <path d="M19 11v1a7 7 0 0 1-14 0v-1m7 8v3" />
        <path d="m3 3 18 18" />
      </>
    ),
  }
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Button({
  children,
  kind = "primary",
  icon,
  onClick,
}: {
  children: ReactNode
  kind?: "primary" | "secondary" | "ghost"
  icon?: IconName
  onClick?: () => void
}) {
  return (
    <button className={`btn ${kind}`} onClick={onClick}>
      {children}
      {icon && <Icon name={icon} size={17} />}
    </button>
  )
}
function PageHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string
  title: string
  sub: string
}) {
  return (
    <div className="page-head">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <div className="page-title">{title}</div>
      <p>{sub}</p>
    </div>
  )
}
function Card({
  children,
  className = "",
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section className={`card ${className}`} id={id}>
      {children}
    </section>
  )
}
function Badge({
  children,
  tone = "good",
}: {
  children: ReactNode
  tone?: "good" | "info" | "attention" | "neutral"
}) {
  return (
    <span className={`badge ${tone}`}>
      <i />
      {children}
    </span>
  )
}

function Crew() {
  const people = [
    ["Maya Chen", "Commander", "Available", "Strong"],
    ["Jon Bell", "Flight Engineer", "In focus time", "Stable"],
    ["Amara Okafor", "Medical Officer", "Available", "Good"],
    ["Luis Ortega", "Mission Specialist", "Resting", "Good"],
  ]
  return (
    <div className="page fade-in">
      <PageHead
        eyebrow="TOGETHER, EVEN FAR FROM HOME"
        title="Crew Coordination"
        sub="Illustrative crew availability. Individual wellbeing is private; these example profiles are not connected crew records."
      />
      <div className="crew-grid">
        {people.map((x, i) => (
          <Card className="crew-card" key={x[0]}>
            <div className={`avatar av${i}`}>
              {x[0]
                .split(" ")
                .map((y) => y[0])
                .join("")}
            </div>
            <div className="crew-name">{x[0]}</div>
            <span>{x[1]}</span>
            <div className="crew-details">
              <div>
                <small>AVAILABILITY</small>
                <Badge tone={i === 1 ? "neutral" : "good"}>{x[2]}</Badge>
              </div>
              <div>
                <small>HEALTH DETAILS</small>
                <b>Private</b>
              </div>
              <div>
                <small>COMMUNICATION</small>
                <b>{i === 1 ? "Later" : "Open"}</b>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="two-col crew-lower">
        <Card>
          <div className="card-kicker">CREW HEALTH</div>
          <div className="card-title">
            Your team · illustrative coordination
          </div>
          <div className="crew-health">
            {[
              ["Crew connection", "Strong", "92"],
              ["Communication", "Stable", "84"],
              ["Team rhythm", "Good", "88"],
            ].map((x) => (
              <div key={x[0]}>
                <span>{x[0]}</span>
                <div>
                  <i style={{ width: `${x[2]}%` }} />
                </div>
                <b>{x[1]}</b>
              </div>
            ))}
          </div>
        </Card>
        <Card className="network-card">
          <div className="card-kicker">CONNECTION MAP</div>
          <div className="crew-network">
            <span className="net-core">
              CREW<i>STRONG</i>
            </span>
            {people.map((x, i) => (
              <span className={`net n${i}`} key={x[0]}>
                {x[0].split(" ")[0]}
              </span>
            ))}
          </div>
        </Card>
      </div>
      <div className="calm-alert">
        <Icon name="support" />
        <div>
          <strong>Crew support may be helpful later today.</strong>
          <span>
            A demanding schedule may leave less space for informal connection.
            Consider a shared meal.
          </span>
        </div>
        <span className="badge info">Illustrative suggestion</span>
      </div>
    </div>
  )
}

function Mission() {
  return (
    <div className="page fade-in">
      <div
        className="mission-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(24,18,54,.95), rgba(74,63,134,.38)), url("${EARTH_IMAGE}")`,
        }}
      >
        <div>
          <Badge tone="info">MARS TRANSIT · NOMINAL</Badge>
          <div className="mission-day">
            Mission Day <strong>147</strong>
          </div>
          <p>Context for your wellbeing, not another control panel.</p>
        </div>
        <div className="earth-distance">
          <span>EARTH DISTANCE</span>
          <strong>41.2M km</strong>
          <small>2 min 18 sec signal delay</small>
        </div>
      </div>
      <div className="mission-stats">
        {[
          ["Destination", "Mars orbit"],
          ["Mission phase", "Outbound transit"],
          ["Crew status", "All connected"],
          ["Next milestone", "Course correction · 12d"],
        ].map((x) => (
          <Card key={x[0]}>
            <span>{x[0]}</span>
            <strong>{x[1]}</strong>
          </Card>
        ))}
      </div>
      <Card className="mission-timeline">
        <div className="card-kicker">MISSION TIMELINE</div>
        <div className="card-title">The journey so far</div>
        <div className="mission-line">
          <div className="line-progress" />
          {[
            ["Launch", "Day 001", "done"],
            ["Earth departure", "Day 018", "done"],
            ["Current", "Day 147", "current"],
            ["Mars transit", "Day 224", ""],
            ["Arrival", "Day 286", ""],
          ].map((x) => (
            <div className={x[2]} key={x[0]}>
              <i>{x[2] === "done" && <Icon name="check" size={12} />}</i>
              <strong>{x[0]}</strong>
              <span>{x[1]}</span>
            </div>
          ))}
        </div>
        <p className="mission-context">
          <Icon name="spark" size={17} /> Long transit periods can change sleep
          and social rhythm. HALO adjusts your personal baseline as the mission
          evolves.
        </p>
      </Card>
    </div>
  )
}

function Onboarding({ close }: { close: () => void }) {
  const [step, setStep] = useState(0)
  const slides = [
    [
      "Welcome to HALO",
      "Your personal wellbeing companion for deep space.",
      "heart",
    ],
    [
      "Learn Your Normal",
      "HALO learns your individual patterns before and during the mission.",
      "model",
    ],
    [
      "Understand Your Signals",
      "Sleep, stress, focus, and connection—understood together, never in isolation.",
      "spark",
    ],
    [
      "Stay Connected",
      "Family and crew support remain close, even when Earth is far away.",
      "family",
    ],
    [
      "You Stay In Control",
      "Your privacy, your choices, your pace. HALO recommends—you decide.",
      "shield",
    ],
  ]
  const x = slides[step]
  return (
    <div className="onboarding">
      <button className="onboarding-skip" onClick={close}>
        Skip introduction
      </button>
      <div className="onboard-visual">
        <div className="onboard-orbits">
          <span />
          <span />
          <span />
          <div>
            <Icon name={x[2] as IconName} size={34} />
          </div>
        </div>
      </div>
      <div className="onboard-copy">
        <div className="brand">
          <span className="brand-mark" />
          <b>
            HALO<span>—CREW</span>
          </b>
        </div>
        <span className="eyebrow">0{step + 1} · 05</span>
        <div className="onboard-title">{x[0]}</div>
        <p>{x[1]}</p>
        {step === 2 && (
          <div className="signal-row">
            {["Sleep", "Stress", "Focus", "Connection"].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        )}
        <div className="onboard-bottom">
          <div className="dots">
            {slides.map((_, i) => (
              <i className={i === step ? "active" : ""} key={i} />
            ))}
          </div>
          <Button onClick={() => (step === 4 ? close() : setStep(step + 1))}>
            {step === 4 ? "Begin" : "Continue"} <Icon name="arrow" size={17} />
          </Button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [page, setPage] = useState<Page>("home")
  const [healthDomain,setHealthDomain]=useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    document.title = `HaloCrew - ${PAGE_TITLES[page]}`
  }, [page])
  const mission = useMission()
  const content = (() => {
    switch (page) {
      case "hardware":
        return <HardwareLab />
      case "health":
        return <DemoHealth initialDomain={healthDomain} />
      case "roadmap":
        return <Roadmap />
      case "home":
        return <Explore go={navigate} />
      case "wellbeing":
      case "model":
        return <DemoWellbeing />
      case "insights":
      case "why":
        return <DemoInsights />
      case "future":
        return <DemoFuture />
      case "support":
      case "history":
        return <DemoSupport />
      case "family":
        return <DemoFamily />
      case "medical":
        return <DemoMedical />
      case "handoff":
        return <DemoHandoff />
      case "crew":
        return <Crew />
      case "mission":
        return <Mission />
      case "copilot":
        return <DemoCopilot />
      case "privacy":
        return <DemoPrivacy />
      case "settings":
        return <DemoSettings go={setPage} />
    }
  })()
  function navigate(p: Destination, domain = 0) {
    setHealthDomain(domain); setPage(p); setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const connection=connectionSummary(mission.connections);
  const sections: {id:Destination;label:string;pages:string[]}[] = [
    {id:"home",label:"Explore",pages:["home"]},
    {id:"health",label:"My body",pages:["health","wellbeing","insights","medical","future"]},
    {id:"support",label:"My mind",pages:["support","family","copilot"]},
    {id:"hardware",label:"Wearables",pages:["hardware"]},
    {id:"handoff",label:"Mission record",pages:["handoff","crew","mission"]},
    {id:"roadmap",label:"What's next",pages:["roadmap"]},
  ];
  return <div className="app dark experience-app">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="experience-header">
      <button className="brand brand-button" onClick={()=>navigate("home")}><span className="brand-mark"/><b>HALO<span>CREW</span></b></button>
      <button className="experience-menu" aria-label="Toggle navigation" aria-expanded={mobileOpen} onClick={()=>setMobileOpen(!mobileOpen)}><Icon name={mobileOpen?"close":"menu"}/></button>
      <nav className={mobileOpen?"experience-nav open":"experience-nav"}>{sections.map(s=><button key={s.id} className={s.pages.includes(page)?"active":""} onClick={()=>navigate(s.id)}>{s.label}</button>)}</nav>
      <button className="experience-profile" onClick={()=>navigate("settings")} aria-label="Mission settings"><span>MC</span><small>MAYA / DAY 147</small></button>
    </header>
    <main id="main">
      <button className={`wearable-connection-bar ${connection.count===0?"disconnected":connection.count===connection.total?"connected":"partial"}`} onClick={()=>navigate("hardware")} aria-label={`Wearables: ${connection.label}. View devices`}><span><i/> Wearables <b>→ {connection.label}</b></span><small>{connection.count}/{connection.total} devices <span>View devices ↗</span></small></button>
      <SectionNavigator page={page} go={navigate}/>
      <div className={`screen-content screen-${page}`}><PageAtmosphere page={page}/>{content}</div>
    </main>
    <footer className="experience-footer"><button onClick={()=>navigate("home")}>HALO CREW</button><span>A little closer to yourself. A little closer to home.</span></footer>
  </div>

}

export default function MissionApp() {
  return (
    <MissionProvider>
      <App />
    </MissionProvider>
  )
}
