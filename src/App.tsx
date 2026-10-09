import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BodyRadar, FutureChart, ModelRadar, Spark, Trend, metricSummary } from "./charts";
import { Waveform } from "./components/ui/waveform";

type Page =
  | "home" | "wellbeing" | "insights" | "why" | "future" | "support"
  | "family" | "crew" | "mission" | "copilot" | "model" | "history"
  | "privacy" | "settings";
type IconName = "home" | "heart" | "spark" | "future" | "support" | "family" | "crew" |
  "mission" | "chat" | "model" | "history" | "shield" | "settings" | "moon" |
  "sun" | "bell" | "arrow" | "play" | "pause" | "check" | "leaf" | "music" |
  "video" | "photo" | "audio" | "lock" | "eye" | "clock" | "close" | "menu" |
  "pulse" | "drop" | "wave" | "phone" | "micoff";

const EARTH_IMAGE = "https://images.unsplash.com/photo-1634176866089-b633f4aec882?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=82&w=1600";

const NAV: { id: Page; label: string; icon: IconName; group?: string }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "wellbeing", label: "My Wellbeing", icon: "heart" },
  { id: "insights", label: "Insights", icon: "spark" },
  { id: "future", label: "Future Self", icon: "future" },
  { id: "support", label: "Support", icon: "support" },
  { id: "family", label: "Family", icon: "family", group: "CONNECTION" },
  { id: "crew", label: "Crew", icon: "crew" },
  { id: "mission", label: "Mission", icon: "mission" },
  { id: "copilot", label: "AI Copilot", icon: "chat", group: "HALO" },
  { id: "model", label: "My Personal Model", icon: "model" },
  { id: "history", label: "What Works For Me", icon: "history" },
];

const PAGE_TITLES: Record<Page, string> = {
  home: "Home", wellbeing: "My Wellbeing", insights: "Insights", why: "Why?",
  future: "Future Self", support: "Support", family: "Family", crew: "Crew",
  mission: "Mission", copilot: "AI Copilot", model: "My Personal Model",
  history: "What Works For Me", privacy: "Privacy", settings: "Settings",
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>,
    spark: <><path d="m12 3-1.4 4.1a5.4 5.4 0 0 1-3.5 3.5L3 12l4.1 1.4a5.4 5.4 0 0 1 3.5 3.5L12 21l1.4-4.1a5.4 5.4 0 0 1 3.5-3.5L21 12l-4.1-1.4a5.4 5.4 0 0 1-3.5-3.5Z"/></>,
    future: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    support: <><path d="M6 8a6 6 0 0 1 12 0v5a3 3 0 0 1-3 3h-1"/><path d="M6 9H4v5h2m12-5h2v5h-2M9 19h6"/></>,
    family: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-4 2-7 6-7s6 3 6 7m0-6c3 0 5 2 5 5"/></>,
    crew: <><circle cx="8" cy="8" r="3"/><circle cx="17" cy="7" r="2.5"/><path d="M2 20c0-4 2-7 6-7s6 3 6 7m1-7c4 0 6 2 6 6"/></>,
    mission: <><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/><path d="M3.5 15.5c5 2.2 12 1 17-4"/></>,
    chat: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 9h8m-8 4h5"/></>,
    model: <><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="7"/><path d="M12 3V1m0 22v-2M3 12H1m22 0h-2"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5m4-2v6l4 2"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    moon: <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5"/></>, play: <path d="m8 5 11 7-11 7Z"/>,
    pause: <><path d="M9 5v14m6-14v14"/></>, check: <path d="m5 12 4 4L19 6"/>,
    leaf: <><path d="M4 20c5-1 9-5 12-12"/><path d="M6 15C2 8 8 3 20 4c1 12-7 16-14 11Z"/></>,
    music: <><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>,
    video: <><rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3"/></>,
    photo: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/></>,
    audio: <><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M19 11v1a7 7 0 0 1-14 0v-1m7 8v3"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>, menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    pulse: <path d="M3 12h4l2.5-7 4.5 14 2.5-7H21"/>,
    drop: <path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z"/>,
    wave: <path d="M2 12c2-7 4-7 6 0s4 7 6 0 4-7 6 0"/>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/>,
    micoff: <><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M19 11v1a7 7 0 0 1-14 0v-1m7 8v3"/><path d="m3 3 18 18"/></>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Button({ children, kind = "primary", icon, onClick }: { children: ReactNode; kind?: "primary" | "secondary" | "ghost"; icon?: IconName; onClick?: () => void }) {
  return <button className={`btn ${kind}`} onClick={onClick}>{children}{icon && <Icon name={icon} size={17}/>}</button>;
}
function PageHead({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub: string }) {
  return <div className="page-head">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<div className="page-title">{title}</div><p>{sub}</p></div>;
}
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}
function Badge({ children, tone = "good" }: { children: ReactNode; tone?: "good" | "info" | "attention" | "neutral" }) {
  return <span className={`badge ${tone}`}><i/>{children}</span>;
}
function Ring({ value = 82, label = "PERSONAL WELLBEING", small = false }: { value?: number; label?: string; small?: boolean }) {
  const R = 80;
  const frac = value / 100;
  const tipA = (-90 + frac * 360) * Math.PI / 180;
  const tip = { x: 95 + R * Math.cos(tipA), y: 95 + R * Math.sin(tipA) };
  const ticks = Array.from({ length: 48 });
  return <div className={`halo-ring ${small ? "small" : ""}`}>
    <svg viewBox="0 0 190 190" aria-hidden="true">
      <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#efe9ff"/><stop offset=".55" stopColor="#b9aef0"/><stop offset="1" stopColor="#7a6ad4"/></linearGradient></defs>
      {ticks.map((_, i) => { const a = i * 7.5 * Math.PI / 180; const major = i % 12 === 0; const r1 = major ? 86 : 88.5, r2 = 92; return <line key={i} className={`tick${major ? " major" : ""}`} x1={95 + r1 * Math.cos(a)} y1={95 + r1 * Math.sin(a)} x2={95 + r2 * Math.cos(a)} y2={95 + r2 * Math.sin(a)} />; })}
      <circle className="track" cx="95" cy="95" r={R} />
      <circle className="prog" cx="95" cy="95" r={R} pathLength={100} strokeDasharray={`${value} 100`} transform="rotate(-90 95 95)" />
      <circle className="tip" cx={tip.x} cy={tip.y} r="5" />
    </svg>
    <div><span className="ring-delta">+4% recovery</span><strong>{value}</strong><span>{label}</span></div>
  </div>;
}
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return <button className={`toggle ${value ? "on" : ""}`} onClick={onChange} aria-label={value ? "Turn off" : "Turn on"}><span/></button>;
}
function Home({ go }: { go: (p: Page) => void }) {
  return <div className="page fade-in">
    <div className="home-hero">
      <div className="hero-copy"><Badge>STABLE TODAY</Badge><div className="hero-title">Good morning, <em>Maya.</em></div><p>Your wellbeing is stable today. You’re moving through the mission with a steady rhythm.</p><div className="hero-stats"><div><span>SLEEP</span><b>7h 18m</b></div><div><span>RECOVERY</span><b>Steady</b></div><div><span>MISSION</span><b>Day 147 of 286</b></div></div><Button onClick={() => go("wellbeing")} kind="secondary">Explore your patterns <Icon name="arrow" size={17}/></Button></div>
      <Ring/>
      <div className="orbit-decor"><span/><span/><span/></div>
    </div>
    <div className="section-title-row"><div><span className="eyebrow">TODAY’S STATE</span><div className="section-title">A quiet look at now</div></div><span className="updated">Updated 8 min ago</span></div>
    <div className="metrics">
      {[["Stress","Stable","Within your normal","62"],["Sleep","7h 18m","12 min below usual","78"],["Focus","Good","Improving today","84"],["Connection","Strong","2 meaningful moments","89"]].map(([a,b,c,d],i)=><Card className="metric" key={a}><div className="metric-top"><span>{a}</span><span className={`metric-icon m${i}`}><Icon name={i===0?"leaf":i===1?"moon":i===2?"spark":"family"} size={18}/></span></div><strong>{b}</strong><p>{c}</p><Spark data={[[61,64,63,72,65,60,68],[80,79,73,78,77,81,76],[78,74,80,79,86,82,84],[85,90,86,87,82,88,89]][i]} color={["#8b7ce0","#ddb273","#8b7ce0","#8fc2a2"][i]}/><span className="metric-value">{d}%</span></Card>)}
    </div>
    <div className="section-title-row"><div><span className="eyebrow">LIVE VITALS · MISSION BIOSENSORS</span><div className="section-title">Body signals, right now</div></div><span className="updated live"><i/>Live</span></div>
    <div className="vitals">
      {[["Heart rate","62 bpm","Resting · steady rhythm","−3 bpm vs usual",[68,66,74,64,63,69,62],"#d99a9b","pulse"],["Blood oxygen","98%","Excellent saturation","+0.2 pts this week",[97.6,98.1,97.4,98.3,97.9,98.4,98],"#7fb0d9","drop"],["Heart rate variability","48 ms","Balanced recovery","+4 ms this week",[42,44,38,46,45,52,48],"#8fc2a2","wave"]].map(([a,b,c,d,e,f,g])=><Card className="metric" key={a as string}><div className="metric-top"><span>{a}</span><span className="metric-icon" style={{ color: f as string, background: `color-mix(in srgb, ${f} 14%, transparent)` }}><Icon name={g as IconName} size={18}/></span></div><strong>{b}</strong><p>{c}</p><Spark data={e as number[]} color={f as string}/><span className="metric-value">{d}</span></Card>)}
    </div>
    <div className="home-grid">
      <Card className="baseline-card"><div className="card-kicker">YOUR NORMAL</div><div className="card-title">Close to your personal baseline</div><p>Small daily changes are expected. Today’s pattern remains comfortably within your usual range.</p><div className="baseline-viz"><div className="range"><span className="current" style={{left:"61%"}}><i/>CURRENT</span></div><div className="range-label"><span>Lower</span><b>Your usual range</b><span>Higher</span></div></div><Button kind="ghost" onClick={() => go("model")}>How HALO learns you <Icon name="arrow" size={16}/></Button></Card>
      <Card className="insight-card"><div className="insight-icon"><Icon name="spark"/></div><div><div className="card-kicker">TODAY’S INSIGHT</div><div className="card-title">A small shift in sleep</div><p>Recent sleep is slightly below your personal baseline. Nothing urgent—an earlier wind-down may help tonight.</p><div className="confidence"><span>Confidence</span><div><i style={{width:"82%"}}/></div><b>82%</b></div><Button kind="secondary" onClick={() => go("why")}>View insight</Button></div></Card>
    </div>
    <div className="quick-card"><div><span className="eyebrow">A MOMENT FOR YOU</span><div className="section-title">What do you need right now?</div></div><div className="quick-actions">{[["Breathe","2 min reset","leaf"],["Recover","Plan a quiet break","moon"],["Connect","A little piece of Earth","family"]].map(([a,b,i])=><button key={a} onClick={() => go(a==="Connect"?"family":"support")}><span><Icon name={i as IconName}/></span><div><strong>{a}</strong><small>{b}</small></div><Icon name="arrow" size={18}/></button>)}</div></div>
  </div>;
}

function Wellbeing({ go }: { go: (p: Page) => void }) {
  const [tab,setTab]=useState("7 Days"); const [metric,setMetric]=useState("Stress");
  return <div className="page fade-in"><PageHead title="My Wellbeing" sub="Understand your patterns over time, without getting lost in the numbers."/><div className="tabs">{["Today","7 Days","30 Days","Mission"].map(x=><button className={tab===x?"active":""} onClick={()=>setTab(x)} key={x}>{x}</button>)}</div>
    <Card className="trend-card"><div className="card-row"><div><div className="card-kicker">WELLBEING TREND · {tab.toUpperCase()}</div><div className="card-title">{metric} is staying steady</div></div><Badge>WITHIN YOUR NORMAL</Badge></div><div className="metric-pills">{["Stress","Sleep","Focus","Connection","Mood","Heart rate","Blood oxygen","HRV"].map(x=><button className={metric===x?"active":""} onClick={()=>setMetric(x)} key={x}>{x}</button>)}</div><Trend metric={metric}/>{(()=>{const s=metricSummary(metric);return <div className="chart-summary"><div><span>Current</span><strong>{s.current}</strong></div><div><span>7-day average</span><strong>{s.avg}</strong></div><div><span>Change</span><strong className="positive">{s.delta}</strong></div></div>})()}</Card>
    <div className="two-col"><Card><div className="card-kicker">YOUR NORMAL</div><div className="card-title">Personal baseline</div><p>Your current state sits comfortably inside the range HALO has learned for you.</p><div className="baseline-wide"><span/><i style={{left:"65%"}}/><b>Today</b></div><div className="baseline-notes"><span>Lower than usual</span><span>Your usual range</span><span>Higher than usual</span></div><Button kind="ghost" onClick={()=>go("model")}>Explore my personal model <Icon name="arrow" size={16}/></Button></Card>
    <Card><div className="card-kicker">MOOD</div><div className="card-title">How today feels</div><div className="moods">{["Calm","Focused","Tired","Stressed","Low"].map((x,i)=><button className={i===0?"active":""} key={x}><span className={`mood-shape s${i}`}/>{x}</button>)}</div><p className="soft-note">Your check-ins help HALO understand context that sensors cannot.</p></Card></div>
  </div>;
}

function Insights({ go }: { go: (p: Page) => void }) {
  const items=[["TODAY","Sleep pattern changed","Recent sleep is slightly below your personal baseline.","Sleep","82%","attention"],["YESTERDAY","Recovery improved","Your recovery time after focused work decreased.","Recovery","91%","good"],["3 DAYS AGO","Social interaction increased","More meaningful crew connection than last week.","Connection","86%","good"],["5 DAYS AGO","Focus rhythm shifted","Your strongest focus period moved earlier in the day.","Focus","74%","info"]];
  return <div className="page fade-in"><PageHead eyebrow="SOMETHING CHANGED" title="Your Insights" sub="HALO looks for meaningful changes across multiple signals, then brings forward only what may matter."/><div className="insight-layout"><div className="feed">{items.map((x,i)=><Card className="feed-item" key={x[1]}><div className={`feed-dot ${x[5]}`}><Icon name={i===0?"moon":i===1?"leaf":i===2?"family":"spark"}/></div><div><span className="feed-date">{x[0]}</span><div className="card-title">{x[1]}</div><p>{x[2]}</p><div className="feed-meta"><Badge tone={x[5] as "good"|"info"|"attention"}>{x[3]}</Badge><span>Confidence {x[4]}</span><span>Importance {i===0?"Worth noticing":"Low"}</span></div></div><Button kind="ghost" onClick={()=>go("why")}>Understand why <Icon name="arrow" size={15}/></Button></Card>)}</div><Card className="learning-card"><div className="halo-mini"><Icon name="spark"/></div><div className="card-title">HALO is learning your rhythm</div><p>Patterns become more personal over time. Current model maturity is strong.</p><div className="progress"><i style={{width:"78%"}}/></div><div className="progress-label"><span>Model maturity</span><b>78%</b></div><hr/><small>More data improves context, not surveillance. You control what is shared.</small></Card></div></div>;
}

function WhyPage() {
  const factors=[["Sleep","41%"],["Workload","27%"],["Social rhythm","18%"],["Other signals","14%"]];
  return <div className="page fade-in"><PageHead eyebrow="A SUPPORTIVE EXPLANATION" title="Why am I feeling different?" sub="HALO found a small change and looked across your recent patterns for context."/><div className="why-grid"><Card className="contributors"><div className="card-row"><div><div className="card-kicker">POSSIBLE CONTRIBUTORS</div><div className="card-title">Sleep may be the strongest signal</div></div><Badge tone="info">CONFIDENCE 82%</Badge></div><div className="factor-orbit"><div className="center-halo"><Icon name="spark"/><span>RECENT<br/>CHANGE</span></div>{factors.map((x,i)=><div className={`factor f${i}`} key={x[0]}><strong>{x[1]}</strong><span>{x[0]}</span></div>)}</div><div className="disclaimer"><Icon name="shield" size={19}/><span>These are contributing signals, not a diagnosis. They help make the recommendation easier to understand.</span></div></Card><div className="why-stack">{[["What changed?","You slept 38 minutes less than your usual range on two of the last three nights."],["What may be contributing?","A later mission schedule and reduced wind-down time appear connected."],["What can I try?","A protected 20-minute recovery break could help restore your usual rhythm."]].map((x,i)=><Card key={x[0]}><span className="step">0{i+1}</span><div className="card-title">{x[0]}</div><p>{x[1]}</p>{i===2&&<Button>See support options <Icon name="arrow" size={16}/></Button>}</Card>)}</div></div></div>;
}

function Future() {
  const [scenario,setScenario]=useState("Recovery break");
  return <div className="page fade-in"><PageHead eyebrow="WHAT HAPPENS NEXT?" title="Future Self" sub="Explore how today’s patterns may evolve. These are projected trends, not certain outcomes."/><Card className="future-hero"><div className="future-head"><div><div className="card-kicker">PROJECTED WELLBEING · NEXT 48 HOURS</div><div className="card-title">A small choice can change the shape of tomorrow</div></div><Badge tone="info">MODEL CONFIDENCE 76%</Badge></div><div className="future-chart"><FutureChart scenario={scenario}/></div><div className="uncertainty-note"><span><i className="good-line"/>Projected with support</span><span><i className="bad-line"/>Projected without change</span><span><i className="range-line"/>Uncertainty range</span></div></Card><Card className="scenario-card"><div><div className="card-kicker">TRY ANOTHER INTERVENTION</div><div className="card-title">What might shift the trajectory?</div><p>Choose an action to explore a possible outcome.</p></div><div className="scenario-options">{["Recovery break","Family connection","Guided breathing","Social interaction","Music","Sleep support"].map(x=><button className={scenario===x?"active":""} onClick={()=>setScenario(x)} key={x}><Icon name={x.includes("Family")?"family":x==="Music"?"music":x.includes("Sleep")?"moon":"leaf"} size={18}/>{x}{scenario===x&&<Icon name="check" size={16}/>}</button>)}</div></Card></div>;
}

const recommendations=[["RECOVER","Take a protected recovery break","High","Low","Your sleep and recovery signals suggest a quiet reset may help.","moon"],["CONNECT","Talk to someone","Medium","Low","Connection has helped you return to baseline during similar days.","crew"],["FAMILY","Spend a few minutes with home","High","None","Family video has been one of your most positive supports.","family"],["RESET","Guided breathing","Medium","None","A short breathing practice often improves your focus rhythm.","leaf"]];
function Support() {
  const [active,setActive]=useState<string|null>(null);
  return <div className="page fade-in"><PageHead eyebrow="WHAT MIGHT HELP?" title="Support, shaped around you" sub="Personalized suggestions based on what has helped before. You always decide what to try."/><div className="recommend-grid">{recommendations.map((x,i)=><Card className={`recommend r${i}`} key={x[0]}><div className="recommend-icon"><Icon name={x[5] as IconName}/></div><span className="card-kicker">{x[0]}</span><div className="card-title">{x[1]}</div><div className="benefits"><span>Expected benefit <b>{x[2]}</b></span><span>Mission disruption <b>{x[3]}</b></span></div><p><strong>Why HALO recommends this</strong>{x[4]}</p><Button onClick={()=>setActive(x[1])}>Try it <Icon name="arrow" size={16}/></Button></Card>)}</div>{active&&<div className="modal-backdrop" onClick={()=>setActive(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setActive(null)}><Icon name="close"/></button><div className="halo-mini"><Icon name="leaf"/></div><div className="page-title">Make space for yourself</div><p>{active} is ready whenever you are. HALO will keep this time protected and quiet.</p><div className="modal-actions"><Button onClick={()=>setActive(null)} icon="play">Begin now</Button><Button kind="secondary" onClick={()=>setActive(null)}>Maybe later</Button></div></div></div>}</div>;
}

const VOICE_AGENTS: Array<[string, string, string, string]> = [
  ["Mei Chen", "Mom", "MC", "Hi sweetheart — how was your day up there?"],
  ["Daniel Chen", "Dad", "DC", "Hey kiddo. The garden is blooming without you."],
  ["Lily Chen", "Sister", "LC", "Maya! You have to hear what happened today."],
];

function Family() {
  const [agent, setAgent] = useState(0);
  const [micOn, setMicOn] = useState(false);
  const [talking, setTalking] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTalking((v) => !v), talking ? 3200 : 2500);
    return () => clearTimeout(t);
  }, [talking]);
  const a = VOICE_AGENTS[agent];
  const caption = talking ? `“${a[3]}”` : micOn ? "Listening — speak now." : "Tap the microphone to speak.";
  const status = talking ? "LIVE · AGENT SPEAKING" : micOn ? "MIC OPEN · LISTENING" : "STANDBY";
  return <div className="page fade-in"><PageHead eyebrow="A LITTLE PIECE OF EARTH" title="Family voices" sub="Talk with AI voice agents shaped by the people waiting back home. They remember you."/><div className="voice-layout">
    <div className="voice-agents"><span className="eyebrow">AI VOICE AGENTS OF YOUR FAMILY MEMBER</span>{VOICE_AGENTS.map((x, i) => <button className={`agent-pick${i === agent ? " active" : ""}`} onClick={() => { setAgent(i); setTalking(false); }} key={x[0]}><span className="agent-avatar">{x[2]}</span><div><strong>{x[0]}</strong><small>{x[1]} · Ready to talk</small></div><span className="talk-pill"><Icon name="phone" size={13}/>Talk</span></button>)}</div>
    <Card className="voice-stage"><div className="voice-head"><span className="agent-avatar big">{a[2]}</span><div><div className="card-title">{a[0]}</div><p>{a[1]} · AI voice agent · Private session</p></div>{talking && <Badge tone="info">ON AIR</Badge>}</div>
      <Waveform label={`${a[0]} · VOICE`} bars={56} playing={talking} intensity="high" className="voice-wave-full" />
      <div className="voice-caption">{caption}</div>
      <div className="voice-controls"><button className={`mic-btn${micOn ? " on" : ""}`} onClick={() => setMicOn(!micOn)} aria-label={micOn ? "Mute microphone" : "Unmute microphone"}><Icon name={micOn ? "audio" : "micoff"} size={26}/></button><span className="voice-status">{status}</span></div>
    </Card></div></div>;
}

function Crew() {
  const people=[["Maya Chen","Commander","Available","Strong"],["Jon Bell","Flight Engineer","In focus time","Stable"],["Amara Okafor","Medical Officer","Available","Good"],["Luis Ortega","Mission Specialist","Resting","Good"]];
  return <div className="page fade-in"><PageHead eyebrow="TOGETHER, EVEN FAR FROM HOME" title="Crew Wellbeing" sub="A shared view that supports coordination while protecting every person’s private wellbeing data."/><div className="crew-grid">{people.map((x,i)=><Card className="crew-card" key={x[0]}><div className={`avatar av${i}`}>{x[0].split(" ").map(y=>y[0]).join("")}</div><div className="crew-name">{x[0]}</div><span>{x[1]}</span><div className="crew-details"><div><small>AVAILABILITY</small><Badge tone={i===1?"neutral":"good"}>{x[2]}</Badge></div><div><small>GENERAL WELLBEING</small><b>{x[3]}</b></div><div><small>COMMUNICATION</small><b>{i===1?"Later":"Open"}</b></div></div></Card>)}</div><div className="two-col crew-lower"><Card><div className="card-kicker">CREW HEALTH</div><div className="card-title">Your team is in rhythm</div><div className="crew-health">{[["Crew connection","Strong","92"],["Communication","Stable","84"],["Team rhythm","Good","88"]].map(x=><div key={x[0]}><span>{x[0]}</span><div><i style={{width:`${x[2]}%`}}/></div><b>{x[1]}</b></div>)}</div></Card><Card className="network-card"><div className="card-kicker">CONNECTION MAP</div><div className="crew-network"><span className="net-core">CREW<i>STRONG</i></span>{people.map((x,i)=><span className={`net n${i}`} key={x[0]}>{x[0].split(" ")[0]}</span>)}</div></Card></div><div className="calm-alert"><Icon name="support"/><div><strong>Crew support may be helpful later today.</strong><span>A demanding schedule may leave less space for informal connection. Consider a shared meal.</span></div><Button kind="secondary">View suggestion</Button></div></div>;
}

function Mission() {
  return <div className="page fade-in"><div className="mission-hero" style={{backgroundImage:`linear-gradient(90deg, rgba(24,18,54,.95), rgba(74,63,134,.38)), url("${EARTH_IMAGE}")`}}><div><Badge tone="info">MARS TRANSIT · NOMINAL</Badge><div className="mission-day">Mission Day <strong>147</strong></div><p>Context for your wellbeing, not another control panel.</p></div><div className="earth-distance"><span>EARTH DISTANCE</span><strong>41.2M km</strong><small>2 min 18 sec signal delay</small></div></div><div className="mission-stats">{[["Destination","Mars orbit"],["Mission phase","Outbound transit"],["Crew status","All connected"],["Next milestone","Course correction · 12d"]].map(x=><Card key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong></Card>)}</div><Card className="mission-timeline"><div className="card-kicker">MISSION TIMELINE</div><div className="card-title">The journey so far</div><div className="mission-line"><div className="line-progress"/>{[["Launch","Day 001","done"],["Earth departure","Day 018","done"],["Current","Day 147","current"],["Mars transit","Day 224",""],["Arrival","Day 286",""]].map(x=><div className={x[2]} key={x[0]}><i>{x[2]==="done"&&<Icon name="check" size={12}/>}</i><strong>{x[0]}</strong><span>{x[1]}</span></div>)}</div><p className="mission-context"><Icon name="spark" size={17}/> Long transit periods can change sleep and social rhythm. HALO adjusts your personal baseline as the mission evolves.</p></Card></div>;
}

type ChatMsg = { id: number; role: "user" | "assistant"; text: string; failed?: boolean };

/* Clearly-separated mock response service (preview only — not a real AI answer). */
function mockAiRespond(): Promise<string> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve("Hello crewmate Maya, how can i help you?"), 2000);
  });
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) parts.push(<code key={`${keyPrefix}-${k++}`} className="md-code">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("**")) parts.push(<strong key={`${keyPrefix}-${k++}`}>{tok.slice(2, -2)}</strong>);
    else parts.push(<em key={`${keyPrefix}-${k++}`}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(text: string): ReactNode {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0, k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      blocks.push(<pre key={k++} className="md-pre"><code>{buf.join("\n")}</code></pre>);
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#{1,3})/)![1].length;
      const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      blocks.push(<Tag key={k++} className="md-head">{renderInline(line.replace(/^#{1,3}\s/, ""), `h${k}`)}</Tag>);
      i++;
      continue;
    }
    if (/^(\s*[-•]\s+)/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^(\s*[-•]\s+)/.test(lines[i])) { items.push(lines[i].replace(/^(\s*[-•]\s+)/, "")); i++; }
      blocks.push(<ul key={k++} className="md-ul">{items.map((t, j) => <li key={j}>{renderInline(t, `u${k}-${j}`)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; }
      blocks.push(<ol key={k++} className="md-ol">{items.map((t, j) => <li key={j}>{renderInline(t, `o${k}-${j}`)}</li>)}</ol>);
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    blocks.push(<p key={k++} className="md-p">{renderInline(line, `p${k}`)}</p>);
    i++;
  }
  return <>{blocks}</>;
}

function ThinkingIndicator() {
  return (
    <div className="thinking" role="status" aria-label="AI is thinking">
      <span className="spinner" aria-hidden="true" />
      <span>Thinking...</span>
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="chat-header">
      <span className="brand-mark chat-mark" aria-hidden="true" />
      <div>
        <b>Copilot</b>
        <small>Private · Personal model active</small>
      </div>
    </div>
  );
}

function ChatMessage({ msg, onRetry }: { msg: ChatMsg; onRetry?: () => void }) {
  if (msg.role === "user") {
    return (
      <div className="msg-row user">
        <div className="bubble user-bubble">{renderMarkdown(msg.text)}</div>
      </div>
    );
  }
  return (
    <div className="msg-row ai">
      <span className="brand-mark ai-mark" aria-hidden="true" />
      <div className="ai-body">
        {renderMarkdown(msg.text)}
        {msg.failed && (
          <div className="chat-error">
            <span>Couldn't send that. Check your connection.</span>
            <button onClick={onRetry}>Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageComposer({ value, onChange, onSend, busy }: {
  value: string; onChange: (v: string) => void; onSend: () => void; busy: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);
  const canSend = value.trim().length > 0 && !busy;
  return (
    <div className="composer-wrap">
      <div className="composer">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (canSend) onSend(); }
          }}
          placeholder="Message Copilot..."
          aria-label="Message Copilot"
        />
        <button
          className="send-btn"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
        >
          <Icon name="arrow" size={17} />
        </button>
      </div>
      <small className="composer-hint">Enter to send · Shift + Enter for a new line</small>
    </div>
  );
}

function Copilot() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [follow, setFollow] = useState(true);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && follow) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, follow]);

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || thinking) return;
    const userMsg: ChatMsg = { id: idRef.current++, role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setFollow(true);
    setThinking(true);
    try {
      const reply = await mockAiRespond();
      setMessages((m) => [...m, { id: idRef.current++, role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [...m, { id: idRef.current++, role: "assistant", text: "", failed: true }]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking]);

  const retry = useCallback(() => {
    setMessages((m) => m.filter((x) => !x.failed));
    const lastUser = [...messages].reverse().find((x) => x.role === "user");
    if (lastUser) send(lastUser.text);
  }, [messages, send]);

  return (
    <div className="page fade-in">
      <PageHead eyebrow="HALO KNOWS YOUR PATTERNS" title="HALO Copilot" sub="A specialized wellbeing companion that explains what it notices and leaves every choice with you." />
      <section className="card chat-shell">
        <ChatHeader />
        <div
          className="chat-scroll"
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setFollow(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
          }}
        >
          {messages.length === 0 && !thinking ? (
            <div className="chat-welcome">
              <span className="brand-mark welcome-mark" aria-hidden="true" />
              <div className="chat-welcome-title">What can I help you with today?</div>
              <p>Ask about your patterns, recovery, or mission rhythm. This conversation stays in this session.</p>
              <div className="chat-suggestions">
                {["Why is my recovery slower?", "What can I do now?", "Show my trends"].map((s) => (
                  <button key={s} onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-thread">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} onRetry={retry} />
              ))}
              {thinking && (
                <div className="msg-row ai">
                  <span className="brand-mark ai-mark" aria-hidden="true" />
                  <div className="ai-body"><ThinkingIndicator /></div>
                </div>
              )}
            </div>
          )}
        </div>
        <MessageComposer value={input} onChange={setInput} onSend={() => send()} busy={thinking} />
      </section>
    </div>
  );
}

function PersonalModel() {
  return <div className="page fade-in"><PageHead eyebrow="HALO LEARNS YOUR NORMAL" title="My Personal Model" sub="A living picture of your unique rhythms—not a comparison with anyone else."/><div className="model-grid"><Card className="radar-card"><div className="card-row"><div><div className="card-kicker">YOUR PATTERN TODAY</div><div className="card-title">Close to your normal</div></div><Badge>STABLE</Badge></div><ModelRadar/><div className="radar-legend"><span><i className="base"/>Personal baseline</span><span><i className="now"/>Current state</span></div></Card><div className="model-info"><Card><div className="halo-mini"><Icon name="model"/></div><div className="card-title">Personal, not generic</div><p>HALO compares today with your own history, adapting as mission conditions and your rhythms change.</p></Card><Card><div className="card-kicker">MODEL MATURITY</div><strong className="big-stat">78%</strong><div className="progress"><i style={{width:"78%"}}/></div><p>Strong enough to recognize your usual range. More data adds context over time.</p></Card><Card className="model-private"><Icon name="shield"/><div><strong>Your model belongs to you</strong><p>Detailed signals stay in secure personal processing.</p></div></Card></div></div><Card className="physical-card"><div><div className="card-kicker">PHYSICAL CONDITION</div><div className="card-title">Body signals in your model</div><p>Resting heart rate, oxygen saturation, and variability — scored against your own baseline, not population averages.</p><div className="phys-rows">{[["Resting heart rate","62 bpm",78],["Blood oxygen saturation","98%",96],["Heart rate variability","48 ms",76]].map(x=><div key={x[0] as string}><div className="phys-top"><span>{x[0]}</span><b>{x[1]}</b></div><div className="progress"><i style={{width:`${x[2]}%`}}/></div></div>)}</div></div><div><BodyRadar/><div className="radar-legend"><span><i className="base"/>Personal baseline</span><span><i className="now"/>Current state</span></div></div></Card></div>;
}

function History() {
  const rows=[["Family video","Very positive","92","family"],["Recovery break","Positive","84","moon"],["Music","Moderate","68","music"],["Guided breathing","Positive","81","leaf"],["Social interaction","Very positive","90","crew"]];
  return <div className="page fade-in"><PageHead eyebrow="HALO LEARNS WHAT HELPS YOU" title="What Works For Me" sub="A clear history of the support you chose and how your wellbeing responded."/><Card className="history-hero"><div className="halo-mini"><Icon name="leaf"/></div><div><div className="card-title">Connection has been your strongest support</div><p>On demanding days, family and crew connection are followed by the most consistent return toward your normal.</p></div><Badge>LEARNED FROM 18 MOMENTS</Badge></Card><Card className="history-table"><div className="history-head"><span>INTERVENTION</span><span>YOUR RESPONSE</span><span>RELATIVE BENEFIT</span><span>LAST TRIED</span></div>{rows.map((x,i)=><div className="history-row" key={x[0]}><span className="history-name"><i><Icon name={x[3] as IconName} size={18}/></i><b>{x[0]}</b></span><Badge tone={i===2?"info":"good"}>{x[1]}</Badge><span className="benefit-bar"><i style={{width:`${x[2]}%`}}/></span><span>{i===0?"4 days ago":i===1?"Yesterday":i===2?"12 days ago":i===3?"6 days ago":"8 days ago"}</span></div>)}</Card><p className="history-foot"><Icon name="spark" size={17}/> HALO uses outcomes to improve future recommendations. It never starts an intervention without your approval.</p></div>;
}

function Privacy() {
  const [toggles,setToggles]=useState([true,true,false]);
  return <div className="page fade-in"><PageHead eyebrow="PRIVATE BY DESIGN" title="Your Mind. Your Data." sub="Detailed wellbeing information stays personal. You decide what leaves your private space."/><Card className="privacy-flow"><div><span className="privacy-icon private"><Icon name="lock"/></span><small>PRIVATE</small><strong>Detailed wellbeing signals</strong><p>Sleep, mood, stress, personal patterns</p></div><Icon name="arrow"/><div className="halo-process"><span className="privacy-icon"><Icon name="spark"/></span><small>HALO</small><strong>Secure personal processing</strong><p>Your model learns locally</p></div><Icon name="arrow"/><div><span className="privacy-icon safe"><Icon name="shield"/></span><small>CREW-SAFE</small><strong>Necessary support only</strong><p>General availability, safety when needed</p></div></Card><div className="privacy-grid"><Card><div className="card-kicker">YOUR SHARING CONTROLS</div><div className="card-title">Clear choices, changeable anytime</div>{[["Share detailed wellbeing data with medical team","Allows your mission clinician to review detailed trends."],["Allow family recommendations","Lets HALO suggest memories and messages when they may help."],["Allow crew support suggestions","Lets HALO recommend general crew connection without sharing why."]].map((x,i)=><div className="setting-row" key={x[0]}><div><strong>{x[0]}</strong><p>{x[1]}</p></div><Toggle value={toggles[i]} onChange={()=>setToggles(toggles.map((v,j)=>i===j?!v:v))}/></div>)}</Card><Card className="promise-card"><Icon name="shield" size={30}/><div className="card-title">The HALO privacy promise</div><ul><li><Icon name="check" size={15}/>No private psychological scores shown to crew</li><li><Icon name="check" size={15}/>No raw internal IDs or labels</li><li><Icon name="check" size={15}/>Safety alerts use only necessary information</li><li><Icon name="check" size={15}/>You can review sharing at any time</li></ul><Button kind="secondary">View data summary</Button></Card></div></div>;
}

function Settings() {
  const [states,setStates]=useState([true,true,false,true,false]);
  const sections: Array<[string, Array<[string, string]>]> = [
    ["Wellbeing", [["Daily check-in", "A gentle prompt at 19:00"], ["Intervention suggestions", "Only when a meaningful change is found"]]],
    ["Privacy", [["Crew sharing", "General availability only"], ["Family sharing", "Recommendations only"]]],
    ["Mission", [["Mission mode", "Mars transit"], ["Communication mode", "Local-first"]]],
    ["Accessibility", [["Larger text", "Increase interface text size"], ["Reduce motion", "Minimize visual transitions"]]],
  ];
  let n=0;
  return <div className="page fade-in"><PageHead title="Settings" sub="Simple controls for how HALO feels, communicates, and supports you."/><div className="settings-layout"><div className="settings-nav">{sections.map((x,i)=><button className={i===0?"active":""} key={x[0]}>{x[0]}<Icon name="arrow" size={15}/></button>)}</div><div className="settings-main">{sections.map((section)=><Card key={section[0]}><div className="card-kicker">{section[0].toUpperCase()}</div>{section[1].map((entry)=>{const idx=n++;return <div className="setting-row" key={entry[0]}><div><strong>{entry[0]}</strong><p>{entry[1]}</p></div><Toggle value={states[idx] ?? true} onChange={()=>setStates((current)=>current.map((v,j)=>idx===j?!v:v))}/></div>})}</Card>)}</div></div></div>;
}

function Onboarding({ close }: { close: () => void }) {
  const [step,setStep]=useState(0);
  const slides=[["Welcome to HALO","Your personal wellbeing companion for deep space.","heart"],["Learn Your Normal","HALO learns your individual patterns before and during the mission.","model"],["Understand Your Signals","Sleep, stress, focus, and connection—understood together, never in isolation.","spark"],["Stay Connected","Family and crew support remain close, even when Earth is far away.","family"],["You Stay In Control","Your privacy, your choices, your pace. HALO recommends—you decide.","shield"]];
  const x=slides[step];
  return <div className="onboarding"><button className="onboarding-skip" onClick={close}>Skip introduction</button><div className="onboard-visual"><div className="onboard-orbits"><span/><span/><span/><div><Icon name={x[2] as IconName} size={34}/></div></div></div><div className="onboard-copy"><div className="brand"><span className="brand-mark"/><b>HALO<span>—CREW</span></b></div><span className="eyebrow">0{step+1} · 05</span><div className="onboard-title">{x[0]}</div><p>{x[1]}</p>{step===2&&<div className="signal-row">{["Sleep","Stress","Focus","Connection"].map(s=><span key={s}>{s}</span>)}</div>}<div className="onboard-bottom"><div className="dots">{slides.map((_,i)=><i className={i===step?"active":""} key={i}/>)}</div><Button onClick={()=>step===4?close():setStep(step+1)}>{step===4?"Begin":"Continue"} <Icon name="arrow" size={17}/></Button></div></div></div>;
}

function App() {
  const [page,setPage]=useState<Page>("home");
  const dark=true;
  const [mobileOpen,setMobileOpen]=useState(false);
  const [onboarding,setOnboarding]=useState(false);
  const content=useMemo(()=>{
    switch(page){
      case "home": return <Home go={setPage}/>; case "wellbeing": return <Wellbeing go={setPage}/>;
      case "insights": return <Insights go={setPage}/>; case "why": return <WhyPage/>;
      case "future": return <Future/>; case "support": return <Support/>; case "family": return <Family/>;
      case "crew": return <Crew/>; case "mission": return <Mission/>;       case "copilot": return <Copilot />;
      case "model": return <PersonalModel/>; case "history": return <History/>; case "privacy": return <Privacy/>;
      case "settings": return <Settings/>;
    }
  },[page,dark]);
  const navigate=(p:Page)=>{setPage(p);setMobileOpen(false);window.scrollTo({top:0,behavior:"smooth"})};
  return <div className="app dark">
    <a className="skip-link" href="#main">Skip to content</a>
    {onboarding&&<Onboarding close={()=>setOnboarding(false)}/>}
    <aside className={mobileOpen?"open":""}>
      <button className="brand brand-button" onClick={()=>setOnboarding(true)}><span className="brand-mark"/><b>HALO<span>—CREW</span></b></button>
      <div className="mission-chip"><i/><span><small>ARES III · TRANSIT</small><b>Day 147</b></span></div>
      <nav>{NAV.map((x,i)=><div key={x.id}>{x.group&&<span className="nav-label">{x.group}</span>}<button className={page===x.id?"active":""} onClick={()=>navigate(x.id)}><Icon name={x.icon}/><span>{x.label}</span>{page===x.id&&<i/>}</button>{i===2&&<button className={page==="why"?"active":""} onClick={()=>navigate("why")}><Icon name="eye"/><span>Why?</span>{page==="why"&&<i/>}</button>}</div>)}</nav>
      <div className="side-bottom"><button className={page==="settings"?"active":""} onClick={()=>navigate("settings")}><Icon name="settings"/><span>Settings</span></button><button className={page==="privacy"?"active":""} onClick={()=>navigate("privacy")}><Icon name="shield"/><span>Privacy</span></button><div className="private-chip"><Icon name="lock" size={14}/><span>Personal data protected</span></div></div>
    </aside>
    <div className="app-main">
      <header><button className="mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)}><Icon name={mobileOpen?"close":"menu"}/></button><div className="top-mission"><span><i/>LOCAL MODE</span><b>MISSION DAY 147</b></div><div className="top-actions"><button aria-label="Notifications"><Icon name="bell"/><i/></button><div className="profile"><span>MC</span><div><b>COMMANDER MAYA</b><small>CALM · STABLE</small></div></div></div></header>
      <main id="main">{content}</main>
    </div>
  </div>;
}

export default App;
