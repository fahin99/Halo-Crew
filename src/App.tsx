import { useEffect, useMemo, useState, type ReactNode } from "react"

type Screen = "overview" | "health" | "monitoring" | "insights" | "assistant" | "alerts" | "emergency" | "control" | "earth" | "settings"
type Severity = "NOMINAL" | "WATCH" | "CAUTION" | "CRITICAL"
type Scenario = "nominal" | "co2" | "radiation" | "acute" | "recovery"
type HealthTab = "my" | "vitals" | "cognitive" | "crew" | "check"
type MonitorTab = "environment" | "radiation" | "medkit"
type InsightTab = "detective" | "future" | "readiness"
type AlertTab = "active" | "timeline"

type IconName = "activity" | "alert" | "arrow" | "brain" | "check" | "chevron" | "clock" | "close" | "environment" | "heart" | "home" | "link" | "menu" | "message" | "person" | "plus" | "shield" | "structure" | "watch" | "radiation" | "target" | "earth" | "settings" | "send" | "play" | "pause" | "reset"

const navItems: { id: Screen; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "home" },
  { id: "health", label: "Health", icon: "activity" },
  { id: "monitoring", label: "Monitoring", icon: "environment" },
  { id: "insights", label: "Insights", icon: "brain" },
  { id: "assistant", label: "Assistant", icon: "message" },
  { id: "alerts", label: "Alerts", icon: "alert" },
  { id: "emergency", label: "Emergency", icon: "plus" },
]

const scenarioConfig = {
  nominal: { severity: "NOMINAL" as Severity, hr: 64, co2: 2.4, reaction: 316, spo2: 98, fatigue: 28, readiness: 92 },
  co2: { severity: "CAUTION" as Severity, hr: 82, co2: 5.8, reaction: 348, spo2: 96, fatigue: 61, readiness: 64 },
  radiation: { severity: "WATCH" as Severity, hr: 69, co2: 2.7, reaction: 326, spo2: 98, fatigue: 39, readiness: 73 },
  acute: { severity: "CRITICAL" as Severity, hr: 48, co2: 3.1, reaction: 412, spo2: 89, fatigue: 78, readiness: 28 },
  recovery: { severity: "NOMINAL" as Severity, hr: 67, co2: 2.9, reaction: 321, spo2: 98, fatigue: 35, readiness: 88 },
}

const timelineByScenario: Record<Scenario, { time: string; title: string; detail: string; tone: Severity }[]> = {
  nominal: [
    { time: "09:14", title: "Routine telemetry sweep", detail: "All signals inside Elena's current adaptation corridor.", tone: "NOMINAL" },
    { time: "09:08", title: "Readiness recalculated", detail: "Docking readiness remains nominal at 92%.", tone: "NOMINAL" },
  ],
  co2: [
    { time: "09:31", title: "Crew intervention proposed", detail: "Increase cabin scrubber flow and reassess in 15 minutes.", tone: "CAUTION" },
    { time: "09:29", title: "Docking readiness reduced", detail: "Reaction time and recovery are limiting factors.", tone: "CAUTION" },
    { time: "09:27", title: "Correlated anomaly detected", detail: "CO₂, heart rate, sleep recovery, and cognition linked.", tone: "WATCH" },
    { time: "09:21", title: "Personal deviation detected", detail: "Heart rate reached +2.1 SD above current space baseline.", tone: "WATCH" },
    { time: "09:14", title: "Cabin CO₂ begins rising", detail: "Environmental sensor bay 2 reports a sustained trend.", tone: "WATCH" },
  ],
  radiation: [
    { time: "10:12", title: "EVA schedule held", detail: "External maintenance delayed pending event decay.", tone: "CAUTION" },
    { time: "10:08", title: "Shelter configuration ready", detail: "Shielded compartment occupancy plan generated.", tone: "WATCH" },
    { time: "10:04", title: "Solar particle event injected", detail: "Illustrative mission exposure model activated.", tone: "WATCH" },
  ],
  acute: [
    { time: "11:43", title: "Emergency monitoring active", detail: "Crew assessment protocol and sensor verification requested.", tone: "CRITICAL" },
    { time: "11:42", title: "Possible loss-of-consciousness event", detail: "Motion, posture, SpO₂, and response signals correlated.", tone: "CRITICAL" },
  ],
  recovery: [
    { time: "09:47", title: "Ground packet queued", detail: "184 KB synthesis awaiting next communication window.", tone: "NOMINAL" },
    { time: "09:43", title: "Mission readiness restored", detail: "Docking readiness returned to 88% after reassessment.", tone: "NOMINAL" },
    { time: "09:35", title: "Physiological response improving", detail: "HR and reaction-time trends returning toward baseline.", tone: "NOMINAL" },
  ],
}

const domains = [
  { label: "Cardiovascular", score: 82, icon: "heart" as IconName, trend: "+2" },
  { label: "Cognitive", score: 61, icon: "brain" as IconName, trend: "−7" },
  { label: "Structural", score: 91, icon: "structure" as IconName, trend: "+1" },
  { label: "Environment", score: 74, icon: "environment" as IconName, trend: "−3" },
]

const chartPoints = [78, 80, 79, 82, 81, 77, 76, 76]

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    activity: <path d="M3 12h4l2-6 4 12 2-6h6" />,
    alert: (
      <>
        <path d="M12 3 2.8 19h18.4L12 3Z" />
        <path d="M12 9v4M12 16.5h.01" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    brain: (
      <>
        <path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.2A3.5 3.5 0 0 0 5 15a3 3 0 0 0 4.5 2.6" />
        <path d="M14.5 4.5A3.5 3.5 0 0 1 18 8v.2a3.5 3.5 0 0 1 1 6.8 3 3 0 0 1-4.5 2.6M12 4v16M8 10h4M12 14h4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    environment: (
      <>
        <path d="M12 3v18M8 6c0-2 1.8-3 4-3s4 1 4 3c0 5-8 5-8 10 0 3 2 5 4 5" />
        <path d="M5 12h14" />
      </>
    ),
    heart: <path d="M20.2 5.8a4.8 4.8 0 0 0-6.8 0L12 7.2l-1.4-1.4a4.8 4.8 0 0 0-6.8 6.8L12 21l8.2-8.4a4.8 4.8 0 0 0 0-6.8Z" />,
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    link: <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    message: (
      <>
        <path d="M4 5h16v12H8l-4 4V5Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    shield: (
      <>
        <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    structure: (
      <>
        <path d="M7 4h10M7 20h10M9 4v5l-3 3 3 3v5M15 4v5l3 3-3 3v5" />
        <path d="M9 9h6M9 15h6" />
      </>
    ),
    watch: (
      <>
        <rect x="6" y="5" width="12" height="14" rx="3" />
        <path d="m9 5 1-3h4l1 3M9 19l1 3h4l1-3" />
      </>
    ),
    radiation: <><circle cx="12" cy="12" r="2" /><path d="M11 2a10 10 0 0 0-6.7 3.6l5.2 3A4 4 0 0 1 11 8V2ZM3.3 16A10 10 0 0 0 9 21.5v-6a4 4 0 0 1-1.5-1.3l-4.2 1.8ZM15 21.5a10 10 0 0 0 5.7-5.5l-5.2-3A4 4 0 0 1 15 15.5v6Z" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="m15 9 6-6M17 3h4v4" /></>,
    earth: <><circle cx="12" cy="12" r="9" /><path d="M3.5 9h17M3.5 15h17M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>,
    send: <path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14" />,
    play: <path d="m8 5 11 7-11 7V5Z" />,
    pause: <><path d="M9 5v14M15 5v14" /></>,
    reset: <><path d="M4 11a8 8 0 1 1 2 6M4 11V5M4 11h6" /></>,
  }

  return (
    <svg aria-hidden="true" className="icon" height={size} viewBox="0 0 24 24" width={size} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function PrimaryButton({ children, icon, onClick, type = "button" }: { children: ReactNode; icon?: IconName; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button className="button button-primary" onClick={onClick} type={type}>
      <span>{children}</span>
      {icon && <Icon name={icon} size={18} />}
    </button>
  )
}

function SecondaryButton({ children, icon, onClick }: { children: ReactNode; icon?: IconName; onClick?: () => void }) {
  return (
    <button className="button button-secondary" onClick={onClick} type="button">
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
    </button>
  )
}

function StatusPill({ value, tone }: { value: string; tone?: "green" | "amber" | "red" }) {
  const auto = value.includes("CRITICAL") || value.includes("HIGH") || value.includes("EMERGENCY") ? "red" 
    : value.includes("CAUTION") || value.includes("WATCH") || value.includes("ELEVATED") || value.includes("REVIEW") ? "amber" 
    : value.includes("NOMINAL") || value.includes("STABLE") || value.includes("GOOD") || value.includes("READY") || value.includes("ONLINE") ? "green" 
    : undefined
  const t = tone ?? auto
  return <span className={`status-pill ${t ? `status-pill-${t}` : ""}`}>{value}</span>
}

function MiniSparkline({ values, tone = "cyan" }: { values: number[]; tone?: "cyan" | "amber" | "red" | "green" }) {
  const min = Math.min(...values), max = Math.max(...values), spread = max - min || 1
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / spread) * 22}`).join(" ")
  return <svg className={`mini-sparkline spark-${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" style={{width: "100%", height: "32px", overflow: "visible", stroke: "currentColor", fill: "none"}}><polyline className="spark-base" points="0,30 100,30" strokeOpacity={0.2} strokeWidth={2} /><polyline points={points} strokeWidth={2} /></svg>
}

function ConfidenceBadge({ value = 88 }: { value?: number }) {
  return (
    <span className="badge">
      <Icon name="shield" size={14} />
      {value}% confidence
    </span>
  )
}

function DataFreshnessBadge({ label = "Updated 2m ago" }: { label?: string }) {
  return (
    <span className="badge badge-live">
      <span className="pulse-dot" />
      {label}
    </span>
  )
}

function HealthStatusRing({ score, status }: { score: number; status: "GREEN" | "AMBER" | "RED" }) {
  return (
    <div className={`status-ring status-${status.toLowerCase()}`}>
      <svg aria-hidden="true" viewBox="0 0 180 180">
        <circle className="ring-track" cx="90" cy="90" r="78" />
        <circle className="ring-value" cx="90" cy="90" pathLength="100" r="78" strokeDasharray={`${score} ${100 - score}`} />
      </svg>
      <div className="status-ring-content">
        <span className="eyebrow">HEALTH INDEX</span>
        <strong>{score}</strong>
        <span className="status-label">{status}</span>
      </div>
    </div>
  )
}

function HealthDomainCard({ icon, label, onClick, score, trend }: { icon: IconName; label: string; onClick?: () => void; score: number; trend: string }) {
  const tone = score < 70 ? "amber" : "green"
  return (
    <button className="domain-card" onClick={onClick} type="button">
      <span className={`domain-icon tone-${tone}`}>
        <Icon name={icon} size={21} />
      </span>
      <span className="domain-copy">
        <span>{label}</span>
        <small>Within personal range</small>
      </span>
      <span className="domain-metric">
        <strong>{score}</strong>
        <small className={trend.startsWith("−") ? "trend-down" : "trend-up"}>
          {trend}
        </small>
      </span>
      <Icon name="chevron" size={17} />
    </button>
  )
}

function ActionCard({ onAction, compact = false }: { onAction: () => void; compact?: boolean }) {
  return (
    <section className={`action-card ${compact ? "action-card-compact" : ""}`}>
      <div className="action-icon">
        <Icon name="brain" size={24} />
      </div>
      <div className="action-copy">
        <span className="eyebrow">NEXT STEP · 30 SEC</span>
        <h3>Take a cognitive check</h3>
        <p>A short follow-up will confirm whether this change needs attention.</p>
      </div>
      <PrimaryButton icon="arrow" onClick={onAction}>Start check</PrimaryButton>
    </section>
  )
}

function AlertCard({ onOpen }: { onOpen: () => void }) {
  return (
    <article className="alert-card">
      <div className="alert-symbol">
        <Icon name="alert" size={22} />
      </div>
      <div className="alert-copy">
        <div className="alert-title-row">
          <span className="status-pill status-pill-amber">AMBER</span>
          <span className="muted">09:42 MCT</span>
        </div>
        <h3>Cognitive reading outside recent baseline</h3>
        <p>One follow-up action is recommended. No immediate danger detected.</p>
      </div>
      <SecondaryButton onClick={onOpen}>Review alert</SecondaryButton>
    </article>
  )
}

function TrendChart({ compact = false, points = chartPoints }: { compact?: boolean; points?: number[] }) {
  const polyline = points
    .map((value, index) => {
      const x = 8 + (index / (points.length - 1)) * 284
      const y = 90 - ((value - 55) / 40) * 72
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className={`trend-chart ${compact ? "trend-chart-compact" : ""}`}>
      <div className="chart-grid">
        <span />
        <span />
        <span />
      </div>
      <svg aria-label="Health index trend over seven mission days" viewBox="0 0 300 100">
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity=".24" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#chartFill)" points={`8,96 ${polyline} 292,96`} />
        <polyline className="chart-baseline" points="8,48 292,48" />
        <polyline className="chart-line" points={polyline} />
        <circle className="chart-point" cx="292" cy={polyline.split(" ").at(-1)?.split(",")[1]} r="4" />
      </svg>
    </div>
  )
}

function EmergencyBanner({ onClick }: { onClick: () => void }) {
  return (
    <button className="emergency-banner" onClick={onClick} type="button">
      <span className="emergency-icon">
        <Icon name="plus" size={18} />
      </span>
      <span>
        <strong>Emergency support</strong>
        <small>Transmit priority health event</small>
      </span>
      <Icon name="chevron" size={18} />
    </button>
  )
}

function AssistantMessage({ children, source, user = false }: { children: ReactNode; source?: string; user?: boolean }) {
  return (
    <div className={`assistant-message ${user ? "assistant-message-user" : ""}`}>
      {!user && (
        <span className="assistant-avatar">
          <Icon name="shield" size={17} />
        </span>
      )}
      <div className="message-bubble">
        {!user && <span className="eyebrow">BASED ON CURRENT HEALTH DATA</span>}
        <p>{children}</p>
        {source && <small>Guidance source: {source}</small>}
      </div>
    </div>
  )
}

function CrewListItem({ active, initials, name, onClick, status }: { active?: boolean; initials: string; name: string; onClick?: () => void; status: "green" | "amber" | "red" }) {
  return (
    <button className={`crew-item ${active ? "crew-item-active" : ""}`} onClick={onClick} type="button">
      <span className="crew-avatar">{initials}</span>
      <span className="crew-copy">
        <strong>{name}</strong>
        <small>Expedition 72</small>
      </span>
      <span className={`crew-status status-dot-${status}`} />
    </button>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <span>
        <Icon name="check" size={22} />
      </span>
      <strong>No additional alerts</strong>
      <p>All other systems are within current operating ranges.</p>
    </div>
  )
}

function Toast({ children, show }: { children: ReactNode; show: boolean }) {
  if (!show) return null
  return (
    <div className="toast" role="status">
      <Icon name="check" size={18} />
      {children}
    </div>
  )
}

function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-label={title} aria-modal="true" className="modal" role="dialog">
        <div className="modal-header">
          <div>
            <span className="eyebrow">HALO-CREW ALERT</span>
            <h2>{title}</h2>
          </div>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button">
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function DesktopSidebar({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  return (
    <aside className="desktop-sidebar">
      <Brand />
      <nav aria-label="Primary navigation">
        {navItems.map((item) => (
          <button className={`nav-item ${active === item.id ? "nav-item-active" : ""}`} key={item.id} onClick={() => onNavigate(item.id)} type="button">
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
            {item.id === "alerts" && <span className="nav-count">1</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer" style={{marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "24px"}}>
        <button className={`nav-item ${active === "control" ? "nav-item-active" : ""}`} onClick={() => onNavigate("control")} type="button">
          <Icon name="person" size={19} />
          <span>Mission Control</span>
        </button>
        <button className={`nav-item ${active === "settings" ? "nav-item-active" : ""}`} onClick={() => onNavigate("settings")} type="button">
          <Icon name="settings" size={19} />
          <span>Settings</span>
        </button>
        <div style={{marginTop: "16px"}}>
          <DataFreshnessBadge label="CrewNet connected" />
          <p style={{marginTop: "12px", fontSize: "11px", color: "var(--muted)", lineHeight: "1.4"}}>Decision support only<br />Not a diagnostic system</p>
        </div>
      </div>
    </aside>
  )
}

function BottomNavigation({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  const items = navItems.slice(0, 5)
  return (
    <nav aria-label="Mobile navigation" className="bottom-navigation">
      {items.map((item) => (
        <button className={active === item.id ? "bottom-nav-active" : ""} key={item.id} onClick={() => onNavigate(item.id)} type="button">
          <Icon name={item.icon} size={20} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <span />
      </span>
      <span className="brand-name">
        HALO<span>CREW</span>
      </span>
    </div>
  )
}

function AppHeader({ onMenu, title, onToggleInjector }: { onMenu: () => void; title: string; onToggleInjector: () => void }) {
  return (
    <header className="app-header">
      <button aria-label="Open navigation" className="mobile-menu icon-button" onClick={onMenu} type="button">
        <Icon name="menu" size={22} />
      </button>
      <div className="mobile-brand">
        <Brand />
      </div>
      <div className="header-title">
        <span className="eyebrow">ASTRONAUT HEALTH</span>
        <strong>{title}</strong>
      </div>
      <div className="header-meta">
        <button className="icon-button" onClick={onToggleInjector} type="button" title="Toggle scenario injector">
          <Icon name="settings" size={18} />
        </button>
        <span>
          <small>MISSION ELAPSED TIME</small>
          <strong>184D · 07:32:18</strong>
        </span>
        <DataFreshnessBadge label="Connected" />
        <button aria-label="Open profile" className="profile-button" type="button">
          <span>EC</span>
          <span className="profile-copy">
            <strong>Elena Chen</strong>
            <small>Flight Engineer</small>
          </span>
          <Icon name="chevron" size={16} />
        </button>
      </div>
    </header>
  )
}

function Dashboard({ navigate, onAlert, scenario }: { navigate: (screen: Screen) => void; onAlert: () => void; scenario: Scenario }) {
  const d = scenarioConfig[scenario]
  return (
    <div className="page dashboard-page">
      <div style={{display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "32px", fontSize: "12px", border: "1px solid var(--border)", padding: "16px", borderRadius: "12px"}}>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}><span className="eyebrow">MISSION</span><strong>MARS TRANSIT</strong><span>DAY 143</span></div>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}><span className="eyebrow">CREW</span><strong>3 NOMINAL</strong><span>1 MONITOR</span></div>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}><span className="eyebrow">ENVIRONMENT</span><strong style={{color: d.co2 > 4 ? "var(--amber)" : "inherit"}}>CO₂ {d.co2 > 4 ? "ELEVATED" : "STABLE"}</strong><span>{d.co2.toFixed(2)} mmHg</span></div>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}><span className="eyebrow">READINESS</span><strong style={{color: d.readiness < 70 ? "var(--amber)" : "inherit"}}>DOCKING — {d.readiness < 70 ? "CAUTION" : "READY"}</strong><span>{d.readiness}% confidence</span></div>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}><span className="eyebrow">EARTH LINK</span><strong>18m 42s</strong><span>ONE-WAY DELAY</span></div>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}><span className="eyebrow">HALO AUTONOMY</span><strong style={{color: "var(--cyan)"}}>ACTIVE</strong><span>LEVEL {d.severity === "CRITICAL" ? 5 : d.severity === "CAUTION" ? 4 : 2}</span></div>
      </div>

      {scenario === "acute" && (
        <div style={{background: "var(--surface-red)", border: "1px solid var(--red)", padding: "16px", borderRadius: "12px", marginBottom: "24px", display: "flex", gap: "16px", alignItems: "center"}}>
          <Icon name="alert" size={24} />
          <div style={{flex: 1}}>
            <span className="eyebrow">ACUTE EVENT ENGINE</span>
            <div style={{fontWeight: 600, fontSize: "16px", marginBottom: "4px"}}>POSSIBLE LOSS-OF-CONSCIOUSNESS EVENT</div>
            <div style={{fontSize: "13px", color: "var(--muted)"}}>Multi-sensor confidence 78% · Emergency assessment protocol recommended · Human authorization required</div>
          </div>
          <StatusPill value="CRITICAL" />
        </div>
      )}
      {scenario === "co2" && (
        <div style={{background: "var(--surface-amber)", border: "1px solid var(--amber)", padding: "16px", borderRadius: "12px", marginBottom: "24px", display: "flex", gap: "16px", alignItems: "center"}}>
          <div style={{width: "24px", height: "24px", background: "var(--amber)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold"}}>!</div>
          <div style={{flex: 1}}>
            <span className="eyebrow">EARLY WARNING // MODEL-GENERATED DECISION SUPPORT</span>
            <div style={{fontWeight: 600, fontSize: "16px", marginBottom: "4px"}}>PROGRESSIVE CARDIOVASCULAR DEVIATION</div>
            <div style={{fontSize: "13px", color: "var(--muted)"}}>Observed 17 min · CO₂ ↑ · sleep recovery ↓ · reaction time ↓</div>
          </div>
          <SecondaryButton onClick={() => navigate("insights")}>SHOW EVIDENCE</SecondaryButton>
        </div>
      )}

      <div className="page-heading">
        <div>
          <span className="eyebrow">SOL 184 · PERSONAL STATUS</span>
          <h1>Good morning, Elena.</h1>
          <p>Here is what needs your attention right now.</p>
        </div>
        <div className="heading-badges">
          <ConfidenceBadge />
          <DataFreshnessBadge />
        </div>
      </div>

      <section className="hero-grid">
        <article className="overall-card">
          <div className="overall-visual">
            <HealthStatusRing score={d.severity === "CRITICAL" ? 42 : d.severity === "CAUTION" ? 64 : 88} status={d.severity === "CRITICAL" ? "RED" : d.severity === "CAUTION" ? "AMBER" : "GREEN"} />
          </div>
          <div className="overall-copy">
            <div>
              <span className="eyebrow">OVERALL HEALTH</span>
              <h2>{d.severity === "CAUTION" ? "One follow-up check recommended" : d.severity === "CRITICAL" ? "Emergency assessment recommended" : "All systems nominal"}</h2>
              <p>Your recent readings {d.severity === "NOMINAL" ? "are within your usual baseline." : "are different from your usual baseline."}</p>
            </div>
            <div className="baseline-row">
              <span>
                <small>Personal baseline</small>
                <strong>81–87</strong>
              </span>
              <span>
                <small>7-day change</small>
                <strong className={d.severity === "NOMINAL" ? "green-text" : d.severity === "CRITICAL" ? "red-text" : "amber-text"}>{d.severity === "NOMINAL" ? "+2 points" : d.severity === "CRITICAL" ? "−41 points" : "−18 points"}</strong>
              </span>
            </div>
          </div>
        </article>
        <ActionCard onAction={() => navigate("check")} />
      </section>

      <section style={{display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px"}}>
        <div className="panel" style={{display: "flex", gap: "32px", alignItems: "center"}}>
          <svg viewBox="0 0 260 420" role="img" aria-label="Illustrative astronaut digital twin" style={{width: "120px", height: "auto"}}>
            <defs>
              <linearGradient id="bodyFill" x1="0" x2="1"><stop stopColor="var(--surface)" /><stop offset=".5" stopColor="var(--border)" /><stop offset="1" stopColor="var(--surface)" /></linearGradient>
            </defs>
            <g style={{fill: "none", stroke: "var(--muted)", strokeWidth: 1.5}}>
              <ellipse cx="130" cy="48" rx="31" ry="37" />
              <path d="M100 82c-19 15-25 40-23 82l9 94 12 114h27l5-122 7 122h27l12-114 8-94c3-43-3-68-24-82-18 9-42 9-60 0Z" />
              <path d="M79 105 45 194l17 8 38-73M181 105l34 89-17 8-38-73" />
            </g>
          </svg>
          <div style={{flex: 1, display: "flex", flexDirection: "column", gap: "16px"}}>
            <div>
              <span className="eyebrow">ASTRONAUT DIGITAL TWIN</span>
              <h2>Elena // Sol 184</h2>
            </div>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
              <div><small style={{color: "var(--muted)", display: "block"}}>CARDIOVASCULAR</small><strong>{d.hr > 75 ? "DEVIATION +2.1 SD" : "WITHIN BASELINE"}</strong></div>
              <div><small style={{color: "var(--muted)", display: "block"}}>COGNITIVE</small><strong>{d.reaction > 340 ? "REACTION +11.5%" : "NOMINAL"}</strong></div>
              <div><small style={{color: "var(--muted)", display: "block"}}>RESPIRATORY</small><strong>{d.co2 > 4 ? "TREND RISING" : "STABLE"}</strong></div>
              <div><small style={{color: "var(--muted)", display: "block"}}>MISSION FIT</small><strong>{d.readiness < 70 ? "CAUTION" : "READY"}</strong></div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <span className="eyebrow">HEALTH DOMAINS</span>
          <h2>System overview</h2>
        </div>
        <button className="text-button" onClick={() => navigate("health")} type="button">
          View detailed health <Icon name="arrow" size={16} />
        </button>
      </div>
      <section className="domain-grid">
        {domains.map((domain) => (
          <HealthDomainCard {...domain} key={domain.label} onClick={() => navigate("health")} />
        ))}
      </section>

      <section className="evidence-grid">
        <article className="panel explanation-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">WHAT’S HAPPENING</span>
              <h2>Recent change from your baseline</h2>
            </div>
            <StatusPill value={d.severity} />
          </div>
          <p className="large-body">
            Your cognitive response time was slightly slower across two recent checks. Other health indicators remain stable.
          </p>
          <div className="evidence-row">
            <span>
              <Icon name="brain" size={18} />
              <span>
                <small>Primary signal</small>
                <strong>Response time</strong>
              </span>
            </span>
            <span>
              <Icon name="clock" size={18} />
              <span>
                <small>Observed</small>
                <strong>Last 6 hours</strong>
              </span>
            </span>
            <span>
              <Icon name="shield" size={18} />
              <span>
                <small>Severity</small>
                <strong>Low concern</strong>
              </span>
            </span>
          </div>
        </article>
        <article className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">RECENT TREND</span>
              <h2>Health index</h2>
            </div>
            <span className="trend-value">
              76 <small>today</small>
            </span>
          </div>
          <TrendChart />
          <div className="chart-labels">
            <span>7 days ago</span>
            <span>Personal baseline</span>
            <span>Today</span>
          </div>
        </article>
      </section>
      
      <section style={{display: "flex", gap: "16px", marginBottom: "32px"}}>
        <div className="panel" style={{flex: 1}}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">48-HOUR TRAJECTORY</span>
              <h2>Projected state</h2>
            </div>
            <SecondaryButton onClick={() => navigate("insights")}>SIMULATION</SecondaryButton>
          </div>
          <div style={{display: "flex", justifyContent: "space-between", marginTop: "16px"}}>
            {["NOW", "+6H", "+12H", "+24H", "+48H"].map((t, i) => (
              <div key={t} style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flex: 1}}>
                <div style={{width: "12px", height: "12px", borderRadius: "50%", background: scenario === "co2" && i > 1 ? "var(--amber)" : "var(--cyan)"}} />
                <span style={{fontSize: "12px", color: "var(--muted)"}}>{t}</span>
                <strong style={{fontSize: "11px", textAlign: "center"}}>{scenario === "co2" ? ["WATCH", "CAUTION", "CAUTION", "HIGH RISK", "HIGH RISK"][i] : "NOMINAL"}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="support-row">
        <button className="assistant-entry" onClick={() => navigate("assistant")} type="button">
          <span className="assistant-entry-icon">
            <Icon name="message" size={22} />
          </span>
          <span>
            <small>CREWHEALTH ASSISTANT</small>
            <strong>Ask about your current health status</strong>
          </span>
          <Icon name="arrow" size={18} />
        </button>
        <EmergencyBanner onClick={() => navigate("emergency")} />
      </section>
      <AlertCard onOpen={onAlert} />
    </div>
  )
}

function HealthScreen({ scenario }: { scenario: Scenario }) {
  const [tab, setTab] = useState<HealthTab>("my")
  const d = scenarioConfig[scenario]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DETAILED EVIDENCE</span>
          <h1>Health detail</h1>
          <p>Personalized trends, context, and data quality.</p>
        </div>
        <div className="heading-badges">
          <ConfidenceBadge />
          <DataFreshnessBadge />
        </div>
      </div>
      <div className="tabs" role="tablist">
        {[{id:"my", label:"My Health"}, {id:"vitals", label:"Vitals"}, {id:"cognitive", label:"Cognitive"}, {id:"crew", label:"Crew"}, {id:"check", label:"Daily Check"}].map((item) => (
          <button className={tab === item.id ? "tab-active" : ""} key={item.id} onClick={() => setTab(item.id as HealthTab)} role="tab" type="button">
            {item.label}
          </button>
        ))}
      </div>
      
      {tab === "my" && (
        <section className="detail-grid">
          <article className="panel metric-hero">
            <span className="domain-icon tone-amber">
              <Icon name="brain" size={23} />
            </span>
            <div>
              <span className="eyebrow">CURRENT COGNITIVE INDEX</span>
              <strong>61</strong>
              <StatusPill value="AMBER" />
            </div>
            <p>Below your typical range of 68–76</p>
          </article>
          <article className="panel detail-chart">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">14-DAY TREND</span>
                <h2>Compared with your baseline</h2>
              </div>
              <span className="muted">Index score</span>
            </div>
            <TrendChart points={[74, 72, 76, 73, 71, 72, 69, 67, 70, 66, 65, 63, 62, 61]} />
            <div className="chart-labels">
              <span>Sol 171</span>
              <span>Baseline 68–76</span>
              <span>Sol 184</span>
            </div>
          </article>
          <article className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">KEY MEASURES</span>
                <h2>Evidence summary</h2>
              </div>
            </div>
            <div className="measure-list">
              <span>
                <span><strong>Response time</strong><small>30-second check</small></span>
                <span><strong>{d.reaction} ms</strong><small className="amber-text">+{Math.round((d.reaction/312-1)*100)}% from baseline</small></span>
              </span>
              <span>
                <span><strong>Accuracy</strong><small>Pattern recognition</small></span>
                <span><strong>94%</strong><small>Within range</small></span>
              </span>
              <span>
                <span><strong>Task consistency</strong><small>Last 3 checks</small></span>
                <span><strong>88%</strong><small>Stable</small></span>
              </span>
            </div>
          </article>
          <article className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">PLAIN-LANGUAGE SUMMARY</span>
                <h2>What this means</h2>
              </div>
            </div>
            <p className="large-body">
              Your response speed is slightly slower than usual, while accuracy remains strong. This can happen with fatigue or schedule changes, but the data does not identify a diagnosis.
            </p>
            <div className="quality-row">
              <DataFreshnessBadge label="Synced 2m ago" />
              <ConfidenceBadge value={88} />
            </div>
          </article>
        </section>
      )}

      {tab === "vitals" && (
        <section style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px"}}>
          {[
            {label: "HEART RATE", val: d.hr, unit: "BPM", base: "58-68", dev: d.hr > 75 ? "+2.1 SD ↑" : "+0.3 SD", t: d.hr > 75 ? "amber" : "green", pts: d.hr > 75 ? [20,22,21,25,28,31,34,40] : [18,19,17,20,19,21,20,22]},
            {label: "BLOOD OXYGEN", val: d.spo2, unit: "%", base: "97-99", dev: d.spo2 < 94 ? "−3.2 SD ↓" : "−0.4 SD", t: d.spo2 < 94 ? "red" : "cyan", pts: d.spo2 < 94 ? [28,27,23,21,14,10,7] : [18,19,17,20,19,21,20,22]},
            {label: "RESPIRATION", val: d.co2 > 4 ? 19 : 14, unit: "/MIN", base: "12-16", dev: d.co2 > 4 ? "+1.8 SD ↑" : "+0.2 SD", t: d.co2 > 4 ? "amber" : "cyan", pts: d.co2 > 4 ? [20,22,21,25,28,31,34,40] : [18,19,17,20,19,21,20,22]},
          ].map(v => (
            <div className="panel" key={v.label}>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: "16px"}}>
                <span className="eyebrow">{v.label}</span>
                <StatusPill value="SIMULATED" tone="green" />
              </div>
              <div style={{fontSize: "36px", fontWeight: "bold", marginBottom: "16px"}}>{v.val}<small style={{fontSize: "14px", color: "var(--muted)", marginLeft: "4px"}}>{v.unit}</small></div>
              <MiniSparkline values={v.pts} tone={v.t as any} />
              <div style={{display: "flex", justifyContent: "space-between", marginTop: "16px", fontSize: "12px"}}>
                <span>BASE {v.base}</span>
                <strong style={{color: `var(--${v.t})`}}>{v.dev}</strong>
                <span>Q 94%</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "cognitive" && (
        <section className="detail-grid">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">COGNITIVE STATE</span>
                <h2>Model-derived + Scheduled Tests</h2>
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
              <div style={{fontSize: "48px", fontWeight: "bold"}}>{d.reaction}<small style={{fontSize: "16px", color: "var(--muted)", marginLeft: "8px"}}>ms reaction time</small></div>
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
                <div><small style={{color: "var(--muted)", display: "block"}}>Personal baseline</small><strong>312 ms</strong></div>
                <div><small style={{color: "var(--muted)", display: "block"}}>Deviation</small><strong style={{color: d.reaction > 340 ? "var(--amber)" : "inherit"}}>{Math.round((d.reaction/312-1)*100)}%</strong></div>
                <div><small style={{color: "var(--muted)", display: "block"}}>Trend</small><strong>{d.reaction > 340 ? "WORSENING" : "STABLE"}</strong></div>
              </div>
              <PrimaryButton icon="play">Start 30s Reaction Test</PrimaryButton>
            </div>
          </article>
        </section>
      )}

      {tab === "crew" && (
        <section>
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "32px"}}>
            {[
              ["ELENA CHEN", "FLIGHT ENGINEER", d.severity, "EC"],
              ["MAYA OKAFOR", "COMMANDER", "NOMINAL", "MO"],
              ["LIAM TORRES", "MEDICAL OFFICER", scenario === "radiation" ? "WATCH" : "NOMINAL", "LT"],
              ["JONAS MEYER", "MISSION SPECIALIST", "NOMINAL", "JM"]
            ].map(c => (
              <div className="panel" key={c[0]} style={{display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start"}}>
                <span className="crew-avatar" style={{width: "48px", height: "48px", fontSize: "18px"}}>{c[3]}</span>
                <span className="eyebrow">{c[1]}</span>
                <strong>{c[0]}</strong>
                <StatusPill value={c[2]} />
                <div style={{display: "flex", gap: "16px", marginTop: "8px", fontSize: "11px"}}>
                  <span>READINESS <b>{c[0].startsWith("ELENA") ? d.readiness : 91}%</b></span>
                  <span>SIGNAL Q <b>96%</b></span>
                </div>
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">CREW HEALTH TOPOLOGY</span>
                <h2>Shared Environment</h2>
              </div>
            </div>
            <div style={{padding: "24px", background: "var(--surface)", borderRadius: "12px", textAlign: "center"}}>
              <strong>SHARED HABITAT</strong><br/>
              <span style={{color: scenario === "co2" ? "var(--amber)" : "inherit"}}>CO₂ {scenario === "co2" ? "ELEVATED" : "STABLE"}</span>
            </div>
          </div>
        </section>
      )}

      {tab === "check" && (
        <div className="check-shell" style={{maxWidth: "600px", margin: "0 auto"}}>
          <article className="check-card">
            <span className="check-icon">
              <Icon name="brain" size={27} />
            </span>
            <span className="eyebrow">DAILY CHECK</span>
            <h1>Ready for a quick focus check?</h1>
            <p>Tap the highlighted sequence as it appears. This check takes about 30 seconds.</p>
            <div className="check-actions" style={{marginTop: "24px"}}>
              <PrimaryButton icon="arrow">Start check</PrimaryButton>
            </div>
          </article>
        </div>
      )}
    </div>
  )
}

function MonitoringScreen({ scenario }: { scenario: Scenario }) {
  const [tab, setTab] = useState<MonitorTab>("environment")
  const d = scenarioConfig[scenario]
  const isRad = scenario === "radiation"

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SYSTEM TELEMETRY</span>
          <h1>Monitoring</h1>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {[{id:"environment", label:"Environment"}, {id:"radiation", label:"Radiation"}, {id:"medkit", label:"Medkit"}].map((item) => (
          <button className={tab === item.id ? "tab-active" : ""} key={item.id} onClick={() => setTab(item.id as MonitorTab)} role="tab" type="button">
            {item.label}
          </button>
        ))}
      </div>

      {tab === "environment" && (
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">SPACECRAFT ENVIRONMENT</span>
                <h2>Habitat Sensor Bus</h2>
              </div>
            </div>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px", background: "var(--surface)", borderRadius: "12px", marginBottom: "24px"}}>
              <div style={{textAlign: "center", color: d.co2 > 4 ? "var(--amber)" : "inherit"}}><span>CO₂</span><br/><strong style={{fontSize: "24px"}}>{d.co2.toFixed(1)}</strong> <small>mmHg</small></div>
              <div><Icon name="arrow" size={24} /></div>
              <div style={{textAlign: "center"}}><span>RESP</span><br/><strong style={{fontSize: "24px"}}>{d.co2 > 4 ? "19" : "14"}</strong> <small>/min</small></div>
              <div><Icon name="arrow" size={24} /></div>
              <div style={{textAlign: "center"}}><span>COGNITION</span><br/><strong style={{fontSize: "24px"}}>{d.reaction}</strong> <small>ms</small></div>
            </div>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px"}}>
              <div><small>O₂</small><br/><strong>20.8%</strong></div>
              <div><small>HUMIDITY</small><br/><strong>42%</strong></div>
              <div><small>PRESSURE</small><br/><strong>14.7 psi</strong></div>
              <div><small>AIR QUALITY</small><br/><strong>GOOD</strong></div>
            </div>
          </div>
        </div>
      )}

      {tab === "radiation" && (
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          {isRad && (
            <div style={{background: "var(--surface-amber)", border: "1px solid var(--amber)", padding: "16px", borderRadius: "12px", display: "flex", gap: "16px", alignItems: "center"}}>
              <Icon name="radiation" size={32} />
              <div style={{flex: 1}}>
                <span className="eyebrow">ILLUSTRATIVE SOLAR PARTICLE EVENT</span>
                <div style={{fontWeight: 600, fontSize: "16px", marginBottom: "4px"}}>Protective operational action recommended</div>
                <div style={{fontSize: "13px", color: "var(--muted)"}}>Move nonessential crew activity to the shielded compartment and delay EVA.</div>
              </div>
              <StatusPill value="WATCH" />
            </div>
          )}
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px"}}>
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">EXPOSURE STATE</span>
                  <h2>Configured Mission Model</h2>
                </div>
              </div>
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px"}}>
                <div><small>CUMULATIVE MISSION</small><br/><strong>84.2 mSv</strong></div>
                <div><small>RECENT 24H</small><br/><strong>{isRad ? "1.82" : "0.43"} mSv</strong></div>
                <div><small>EXPOSURE MARGIN</small><br/><strong>{isRad ? "REVIEW" : "NOMINAL"}</strong></div>
                <div><small>SHIELDING STATE</small><br/><strong>{isRad ? "SHELTER READY" : "STANDARD"}</strong></div>
              </div>
            </div>
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">OPERATIONAL IMPACT</span>
                  <h2>Task Schedule</h2>
                </div>
              </div>
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                <div style={{display: "flex", justifyContent: "space-between"}}><span>EVA</span><StatusPill value={isRad ? "REVIEW REQUIRED" : "READY"} /></div>
                <div style={{display: "flex", justifyContent: "space-between"}}><span>DOCKING</span><StatusPill value="UNCHANGED" /></div>
                <div style={{display: "flex", justifyContent: "space-between"}}><span>EXTERNAL MAINTENANCE</span><StatusPill value={isRad ? "DELAY RECOMMENDED" : "READY"} /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "medkit" && (
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          <div style={{display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px"}}>
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">MEDICAL INVENTORY</span>
                  <h2>Last Audit 06:20 UTC</h2>
                </div>
              </div>
              <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                {[["Emergency oxygen", "82%", "STABLE", "23 d"], ["IV supplies", "7 units", "WATCH", "—"], ["ECG patches", "12 units", "STABLE", "61 d"]].map(x => (
                  <div key={x[0]} style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                    <strong style={{width: "150px"}}>{x[0]}</strong>
                    <span style={{width: "80px"}}>{x[1]}</span>
                    <span style={{width: "100px"}}><StatusPill value={x[2]} /></span>
                    <span style={{width: "60px", textAlign: "right"}}>{x[3]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">RESOURCE FORECAST</span>
                  <h2>Remaining 211 Days</h2>
                </div>
              </div>
              <div style={{textAlign: "center", margin: "24px 0", fontSize: "48px", fontWeight: "bold", color: "var(--cyan)"}}>94%</div>
              <div>
                <span className="eyebrow">PROJECTED SHORTAGE RISK</span>
                <StatusPill value={isRad ? "WATCH" : "LOW"} />
                <p style={{marginTop: "8px", fontSize: "13px", color: "var(--muted)"}}>{isRad ? "Increased dosimeter demand in solar event." : "Current inventory supports modelled nominal demand."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InsightsScreen({ scenario, navigate }: { scenario: Scenario; navigate: (s: Screen) => void }) {
  const [tab, setTab] = useState<InsightTab>("detective")
  const active = scenario === "co2"
  const d = scenarioConfig[scenario]
  
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">EXPLAINABLE DECISION SUPPORT</span>
          <h1>Insights</h1>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {[{id:"detective", label:"Health Detective"}, {id:"future", label:"Future Self"}, {id:"readiness", label:"Mission Readiness"}].map((item) => (
          <button className={tab === item.id ? "tab-active" : ""} key={item.id} onClick={() => setTab(item.id as InsightTab)} role="tab" type="button">
            {item.label}
          </button>
        ))}
      </div>

      {tab === "detective" && (
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px"}}>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">CAUSAL EVIDENCE TREE</span>
                <h2>Why is this happening?</h2>
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
              <div style={{padding: "16px", background: "var(--surface)", borderRadius: "8px"}}>
                <span className="eyebrow">HEART RATE ELEVATED</span><br/>
                <strong>{active ? "+2.1 SD" : "WITHIN BASELINE"}</strong>
              </div>
              {[
                ["CABIN CO₂", active ? "Elevated" : "Normal", active ? "84%" : "12%", "Strong temporal alignment"],
                ["EXERCISE RECOVERY", active ? "Incomplete" : "Complete", active ? "67%" : "18%", "Moderate supporting evidence"],
                ["SLEEP RECOVERY", active ? "Reduced" : "Stable", active ? "72%" : "21%", "Prior-night recovery below baseline"]
              ].map(c => (
                <div key={c[0]} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--border)"}}>
                  <div>
                    <strong style={{display: "block"}}>{c[0]}</strong>
                    <small style={{color: "var(--muted)"}}>{c[3]}</small>
                  </div>
                  <div style={{textAlign: "right"}}>
                    <StatusPill value={c[1]} /><br/>
                    <strong>{c[2]}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">HALO ASSESSMENT</span>
                  <h2>Model-generated Support</h2>
                </div>
              </div>
              <p style={{fontSize: "16px", marginBottom: "16px", lineHeight: 1.5}}>{active ? "The pattern is consistent with an environmental contribution compounded by incomplete recovery." : "No active multi-signal anomaly is present."}</p>
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px"}}>
                <div><small>KNOWN</small><br/><strong>{active ? "4 signals changed" : "Signals stable"}</strong></div>
                <div><small>CONFIDENCE</small><br/><strong>{active ? "87%" : "92%"}</strong></div>
              </div>
            </div>
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">SAFE NEXT ACTION</span>
                  <h2>Resource Check Complete</h2>
                </div>
              </div>
              <strong>Increase cabin scrubber flow</strong>
              <p style={{color: "var(--muted)", margin: "8px 0 16px 0", fontSize: "13px"}}>Then reassess cardiovascular and cognitive state after 15 minutes.</p>
              <PrimaryButton icon="check">Apply Environmental Intervention</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {tab === "future" && (
        <div style={{display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px"}}>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">MISSION STRESS TEST</span>
                <h2>Future Trajectories</h2>
              </div>
            </div>
            <div style={{height: "260px", background: "var(--surface)", borderRadius: "8px", position: "relative", marginTop: "16px", overflow: "hidden"}}>
              <svg viewBox="0 0 700 260" preserveAspectRatio="none" style={{width: "100%", height: "100%", stroke: "currentColor", fill: "none"}}>
                <path d="M0 40H700M0 130H700M0 220H700" stroke="var(--border)" strokeWidth={1} />
                <path d={active ? "M0 62 C150 70 210 106 320 130 S510 190 700 215" : "M0 65 C190 67 330 75 480 73 S600 80 700 76"} stroke="var(--amber)" strokeWidth={3} />
                <path d={active ? "M0 62 C140 70 220 110 300 123 S450 90 520 75 S640 64 700 58" : "M0 65 C180 65 350 63 700 60"} stroke="var(--cyan)" strokeWidth={3} strokeDasharray="8 4" />
              </svg>
            </div>
            <div style={{display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "12px", color: "var(--muted)"}}>
              <span>NOW</span><span>+6H</span><span>+12H</span><span>+24H</span><span>+48H</span>
            </div>
          </div>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">PROJECTED STATE // +24H</span>
                <h2>If current trend continues</h2>
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
              {[["CARDIOVASCULAR", active ? "DECLINING" : "STABLE"], ["COGNITIVE", active ? "MODERATE" : "STABLE"], ["DOCKING", active ? "REVIEW REQUIRED" : "READY"]].map(x => (
                <div key={x[0]} style={{display: "flex", justifyContent: "space-between"}}>
                  <span>{x[0]}</span>
                  <StatusPill value={x[1]} />
                </div>
              ))}
            </div>
            <div style={{marginTop: "24px", padding: "12px", background: "var(--surface)", borderRadius: "8px", fontSize: "12px", display: "flex", gap: "8px"}}>
              <Icon name="alert" size={16} />
              <span>This simulation shows possible trajectories, not certainty.</span>
            </div>
          </div>
        </div>
      )}

      {tab === "readiness" && (
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px"}}>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">TASK REQUIREMENTS</span>
                <h2>Docking Readiness</h2>
              </div>
            </div>
            <div style={{display: "flex", gap: "8px", marginBottom: "24px"}}>
              {["EVA", "DOCKING", "REPAIR"].map((t, i) => (
                <SecondaryButton key={t} onClick={()=>{}}>{t}</SecondaryButton>
              ))}
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
              {[
                ["Cardiovascular stability", active ? "MODERATE" : "GOOD", active ? 66 : 92],
                ["Reaction time", d.reaction > 340 ? "ELEVATED" : "GOOD", d.reaction > 340 ? 64 : 93],
                ["Sleep recovery", active ? "MODERATE" : "GOOD", active ? 58 : 84]
              ].map(f => (
                <div key={f[0] as string}>
                  <div style={{display: "flex", justifyContent: "space-between", marginBottom: "4px"}}>
                    <span>{f[0]}</span>
                    <strong>{f[2]}%</strong>
                  </div>
                  <div style={{height: "6px", background: "var(--surface)", borderRadius: "3px", overflow: "hidden"}}>
                    <div style={{height: "100%", width: `${f[2]}%`, background: (f[2] as number) < 70 ? "var(--amber)" : "var(--cyan)"}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel" style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
            <span className="eyebrow">CURRENT ASSESSMENT</span>
            <div style={{fontSize: "36px", fontWeight: "bold", color: d.readiness < 70 ? "var(--amber)" : "var(--cyan)", marginBottom: "16px"}}>{d.readiness < 70 ? "CAUTION" : "READY"}</div>
            <p style={{marginBottom: "24px", lineHeight: 1.5}}>{d.readiness < 70 ? "The current correlated pattern reduces reserve for time-critical docking operations. Environmental correction recommended." : "No current factor exceeds Elena's task-specific operational corridor."}</p>
            <div>
              <span className="eyebrow">MODEL CONFIDENCE</span>
              <strong> {d.readiness < 70 ? "87" : "92"}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AssistantScreen({ navigate, scenario }: { navigate: (screen: Screen) => void; scenario: Scenario }) {
  const [sent, setSent] = useState(false)
  const d = scenarioConfig[scenario]
  return (
    <div className="page assistant-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LOCAL · OFFLINE CAPABLE</span>
          <h1>CrewHealth Assistant</h1>
          <p>Concise guidance grounded in your mission health data.</p>
        </div>
        <DataFreshnessBadge label="On-device" />
      </div>
      <div className="assistant-layout">
        <section className="chat-panel">
          <div className="chat-date">
            <span>Current session · Sol 184</span>
          </div>
          <AssistantMessage source="Crew fatigue protocol 4.2">
            Your overall health index is {d.severity === "CRITICAL" ? 42 : d.severity === "CAUTION" ? 64 : 88}. {d.severity !== "NOMINAL" ? "A short follow-up check is the recommended next step." : "All systems are stable."}
          </AssistantMessage>
          {sent && (
            <AssistantMessage user>Why is my status amber?</AssistantMessage>
          )}
          {sent && (
            <AssistantMessage source="Halo-Crew baseline comparison; Flight Medical Rule 12-B">
              Your status is amber because two cognitive readings were outside your recent personal range. Cardiovascular and structural indicators remain stable.
            </AssistantMessage>
          )}
          <div className="suggested-questions">
            <span className="eyebrow">SUGGESTED QUESTIONS</span>
            <div>
              <button onClick={() => setSent(true)} type="button">Why is my status amber?</button>
              <button onClick={() => setSent(true)} type="button">What should I do next?</button>
              <button onClick={() => setSent(true)} type="button">Show supporting data</button>
            </div>
          </div>
          <form className="chat-input" onSubmit={(event) => { event.preventDefault(); setSent(true) }}>
            <input aria-label="Ask CrewHealth Assistant" placeholder="Ask about your current health…" />
            <PrimaryButton icon="send" type="submit">Send</PrimaryButton>
          </form>
        </section>
        <aside className="assistant-context">
          <span className="eyebrow">CURRENT CONTEXT</span>
          <h2>Health snapshot</h2>
          <HealthStatusRing score={d.severity === "CRITICAL" ? 42 : d.severity === "CAUTION" ? 64 : 88} status={d.severity === "CRITICAL" ? "RED" : d.severity === "CAUTION" ? "AMBER" : "GREEN"} />
          <div className="context-list">
            <span><small>Leading change</small><strong>Cognitive</strong></span>
            <span><small>Confidence</small><strong>88%</strong></span>
            <span><small>Uncertainty</small><strong>Low</strong></span>
          </div>
          <div className="panel" style={{marginTop: "24px"}}>
            <span className="eyebrow">EVIDENCE SOURCES</span>
            <ul style={{listStyle: "none", padding: 0, margin: "8px 0 0 0", fontSize: "12px"}}>
              <li style={{marginBottom: "8px"}}><StatusPill value="SIMULATED" tone="green" /> Wearable telemetry</li>
              <li><StatusPill value="CACHED" tone="amber" /> NASA HRP References</li>
            </ul>
          </div>
          <div style={{marginTop: "24px"}}>
            <EmergencyBanner onClick={() => navigate("emergency")} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function AlertsScreen({ onAlert, scenario }: { onAlert: () => void; scenario: Scenario }) {
  const [tab, setTab] = useState<AlertTab>("active")
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACTIVE ATTENTION ITEMS</span>
          <h1>Alerts</h1>
          <p>Clear states, evidence, and acknowledgment history.</p>
        </div>
        <StatusPill value="1 ACTIVE" />
      </div>
      <div className="tabs" role="tablist">
        {[{id:"active", label:"Active"}, {id:"timeline", label:"Timeline"}].map((item) => (
          <button className={tab === item.id ? "tab-active" : ""} key={item.id} onClick={() => setTab(item.id as AlertTab)} role="tab" type="button">
            {item.label}
          </button>
        ))}
      </div>
      
      {tab === "active" && (
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          <AlertCard onOpen={onAlert} />
          <EmptyState />
        </div>
      )}

      {tab === "timeline" && (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">MISSION TIMELINE</span>
              <h2>Event History</h2>
            </div>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px"}}>
            {timelineByScenario[scenario].map((e, i) => (
              <div key={e.time} style={{display: "flex", gap: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border)"}}>
                <div style={{width: "60px", color: "var(--muted)", fontSize: "12px"}}>{e.time}</div>
                <div style={{flex: 1}}>
                  <strong style={{display: "block", marginBottom: "4px"}}>{e.title}</strong>
                  <p style={{fontSize: "13px", color: "var(--muted)", margin: 0}}>{e.detail}</p>
                </div>
                <div><StatusPill value={e.tone} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EmergencyScreen({ onSend }: { onSend: () => void }) {
  return (
    <div className="page emergency-page">
      <div className="emergency-heading">
        <span className="emergency-large-icon">
          <Icon name="plus" size={30} />
        </span>
        <div>
          <span className="eyebrow">PRIORITY CHANNEL</span>
          <h1>Emergency health transmission</h1>
          <p>Use only for an active or suspected critical health event.</p>
        </div>
        <StatusPill value="READY" />
      </div>
      <section className="emergency-grid">
        <article className="panel emergency-summary">
          <span className="eyebrow">EVENT SUMMARY</span>
          <h2>Manual emergency support request</h2>
          <p>
            No automatic critical event is active. Starting transmission will immediately prioritize your recent health state and location for mission control.
          </p>
          <div className="transmission-list">
            <span>
              <Icon name="activity" size={18} />
              <span>
                <strong>Recent health summary</strong>
                <small>Last 30 minutes of key indicators</small>
              </span>
              <Icon name="check" size={18} />
            </span>
            <span>
              <Icon name="person" size={18} />
              <span>
                <strong>Crew identity and location</strong>
                <small>Elena Chen · US Lab Module</small>
              </span>
              <Icon name="check" size={18} />
            </span>
            <span>
              <Icon name="message" size={18} />
              <span>
                <strong>Current event note</strong>
                <small>Manual support request</small>
              </span>
              <Icon name="check" size={18} />
            </span>
          </div>
          <PrimaryButton icon="arrow" onClick={onSend}>
            Transmit priority event
          </PrimaryButton>
        </article>
        <aside className="panel transmission-status">
          <span className="eyebrow">TRANSMISSION STATUS</span>
          <div className="status-step status-step-active">
            <span>1</span>
            <div>
              <strong>Ready</strong>
              <small>Package prepared locally</small>
            </div>
          </div>
          <div className="status-step">
            <span>2</span>
            <div>
              <strong>Sending</strong>
              <small>Priority Earth-link queue</small>
            </div>
          </div>
          <div className="status-step">
            <span>3</span>
            <div>
              <strong>Delivered</strong>
              <small>Mission control confirmed</small>
            </div>
          </div>
          <div className="priority-box">
            <small>TRANSMISSION PRIORITY</small>
            <strong>Highest · Medical</strong>
            <span>Preempts routine downlink traffic</span>
          </div>
        </aside>
      </section>
    </div>
  )
}

function MissionControl({ onAlert, scenario }: { onAlert: () => void; scenario: Scenario }) {
  return (
    <div className="page control-page">
      <div className="control-header">
        <div>
          <span className="eyebrow">MISSION CONTROL · MEDICAL OPERATIONS</span>
          <h1>Expedition 72 crew health</h1>
        </div>
        <div className="heading-badges">
          <DataFreshnessBadge label="Earth link stable" />
          <span className="time-display">14:32:18 UTC</span>
        </div>
      </div>
      <section className="fleet-summary">
        <div><small>CREW STATUS</small><strong>6 <span>monitored</span></strong></div>
        <div><small>GREEN</small><strong className="green-text">4</strong></div>
        <div><small>AMBER</small><strong className="amber-text">2</strong></div>
        <div><small>RED</small><strong className="red-text">0</strong></div>
        <div><small>OPEN ACTIONS</small><strong>3</strong></div>
      </section>
      <div className="control-layout">
        <aside className="crew-list panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CREW</span>
              <h2>Active roster</h2>
            </div>
          </div>
          <CrewListItem active initials="EC" name="Elena Chen" status="amber" />
          <CrewListItem initials="JM" name="Jonas Meyer" status="green" />
          <CrewListItem initials="SA" name="Samira Abbas" status="green" />
          <CrewListItem initials="RK" name="Ravi Kulkarni" status="amber" />
          <CrewListItem initials="MO" name="Maya Okafor" status="green" />
          <CrewListItem initials="LT" name="Lucas Torres" status="green" />
        </aside>
        <main className="control-main">
          <article className="panel selected-crew">
            <div className="selected-profile">
              <span className="crew-avatar large">EC</span>
              <div>
                <span className="eyebrow">SELECTED CREW</span>
                <h2>Elena Chen</h2>
                <p>Flight Engineer · US Lab Module</p>
              </div>
            </div>
            <div className="selected-score">
              <StatusPill value="AMBER" />
              <strong>76</strong>
              <small>Health index</small>
            </div>
            <div className="mini-domains">
              {domains.map((item) => (
                <span key={item.label}>
                  <small>{item.label}</small>
                  <strong>{item.score}</strong>
                </span>
              ))}
            </div>
          </article>
          <article className="panel control-trend">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">HEALTH TREND</span>
                <h2>14-day index and baseline</h2>
              </div>
              <ConfidenceBadge />
            </div>
            <TrendChart points={[84, 85, 82, 83, 86, 84, 82, 81, 83, 80, 79, 78, 76, 76]} />
          </article>
          <AlertCard onOpen={onAlert} />
        </main>
        <aside className="ops-column">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">EARTH-LINK QUEUE</span>
                <h2>3 items</h2>
              </div>
              <Icon name="link" size={18} />
            </div>
            <div className="ops-list">
              <span>
                <i className="status-dot-green" />
                <span>
                  <strong>Health summary</strong>
                  <small>Delivered · 14:28</small>
                </span>
              </span>
              <span>
                <i className="status-dot-amber" />
                <span>
                  <strong>Cognitive evidence</strong>
                  <small>Sending · 62%</small>
                </span>
              </span>
              <span>
                <i />
                <span>
                  <strong>Routine sensor batch</strong>
                  <small>Queued · 14:35</small>
                </span>
              </span>
            </div>
          </article>
          <article className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">ACTION TIMELINE</span>
                <h2>Sol 184</h2>
              </div>
            </div>
            <div className="timeline">
              <span>
                <i />
                <small>09:42</small>
                <p>Amber alert generated</p>
              </span>
              <span>
                <i />
                <small>09:44</small>
                <p>Crew notified</p>
              </span>
              <span>
                <i />
                <small>10:02</small>
                <p>Follow-up queued</p>
              </span>
            </div>
          </article>
        </aside>
      </div>
    </div>
  )
}

function EarthLinkScreen() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">GROUND COMMUNICATIONS</span>
          <h1>Earth Link</h1>
        </div>
        <StatusPill value="AUTONOMY ACTIVE" tone="green" />
      </div>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px"}}>
        <div className="panel" style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", minHeight: "300px"}}>
          <div style={{display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between"}}>
            <div style={{width: "60px", height: "60px", borderRadius: "50%", background: "var(--surface)", border: "2px solid var(--cyan)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold"}}>MARS</div>
            <div style={{flex: 1, borderTop: "2px dashed var(--border)", margin: "0 16px", position: "relative"}}>
              <span style={{position: "absolute", top: "-24px", left: "50%", transform: "translateX(-50%)", fontSize: "12px", color: "var(--cyan)"}}>18m 42s</span>
            </div>
            <div style={{width: "60px", height: "60px", borderRadius: "50%", background: "var(--surface)", border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold"}}>EARTH</div>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", width: "100%", textAlign: "center"}}>
            <div><span className="eyebrow">ONE WAY</span><br/><strong>18m 42s</strong></div>
            <div><span className="eyebrow">ROUND TRIP</span><br/><strong>37m 24s</strong></div>
            <div><span className="eyebrow">NEXT WINDOW</span><br/><strong>02:14:32</strong></div>
          </div>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">GROUND PACKET 0143-A</span>
                <h2>Queued // 184 KB</h2>
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px"}}>
              {[
                "Current status + anomalies",
                "Personal trends + uncertainty",
                "Mission readiness assessment"
              ].map(x => (
                <div key={x} style={{display: "flex", gap: "8px", alignItems: "center", fontSize: "13px"}}>
                  <Icon name="check" size={14} /> {x}
                </div>
              ))}
            </div>
            <PrimaryButton icon="send">Prioritize Transmission</PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsScreen() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SYSTEM CONFIGURATION</span>
          <h1>Settings</h1>
        </div>
      </div>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px"}}>
        <div className="panel">
          <span className="eyebrow">TELEMETRY</span>
          <h3 style={{margin: "8px 0"}}>Heart rate · SpO₂</h3>
          <p style={{fontSize: "13px", color: "var(--muted)", marginBottom: "16px"}}>Refresh 5–10 seconds</p>
          <SecondaryButton>View Configuration</SecondaryButton>
        </div>
        <div className="panel">
          <span className="eyebrow">ENVIRONMENT</span>
          <h3 style={{margin: "8px 0"}}>CO₂ · O₂ · pressure</h3>
          <p style={{fontSize: "13px", color: "var(--muted)", marginBottom: "16px"}}>Refresh 5–30 seconds</p>
          <SecondaryButton>View Configuration</SecondaryButton>
        </div>
        <div className="panel">
          <span className="eyebrow">AUTONOMY</span>
          <h3 style={{margin: "8px 0"}}>Ground delay aware</h3>
          <p style={{fontSize: "13px", color: "var(--muted)", marginBottom: "16px"}}>Human authority always retained</p>
          <SecondaryButton>View Configuration</SecondaryButton>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("overview")
  const [menuOpen, setMenuOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [toast, setToast] = useState("")
  const [scenario, setScenario] = useState<Scenario>("co2")
  const [showInjector, setShowInjector] = useState(false)

  const title = useMemo(() => navItems.find((item) => item.id === screen)?.label ?? (screen === "control" ? "Mission Control" : screen === "earth" ? "Earth Link" : screen === "settings" ? "Settings" : "Overview"), [screen])

  const navigate = (next: Screen) => {
    setScreen(next)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 3200)
  }

  return (
    <div className="app-shell">
      <DesktopSidebar active={screen} onNavigate={navigate} />
      {menuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)} role="presentation">
          <div className="mobile-drawer" onClick={(event) => event.stopPropagation()} role="presentation">
            <DesktopSidebar active={screen} onNavigate={navigate} />
          </div>
        </div>
      )}
      <div className="app-main">
        <AppHeader onMenu={() => setMenuOpen(true)} title={title} onToggleInjector={() => setShowInjector(!showInjector)} />
        
        {showInjector && (
          <div style={{background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "16px 24px", display: "flex", gap: "24px", alignItems: "center"}}>
            <div>
              <span className="eyebrow" style={{display: "block", marginBottom: "4px"}}>EVENT INJECTOR</span>
              <strong style={{fontSize: "13px"}}>Propagate a mission-health event through all engines</strong>
            </div>
            <div style={{display: "flex", gap: "8px"}}>
              {(["nominal", "co2", "radiation", "acute", "recovery"] as Scenario[]).map(s => (
                <button 
                  key={s} 
                  type="button" 
                  onClick={() => setScenario(s)} 
                  style={{padding: "6px 12px", borderRadius: "100px", border: "1px solid", fontSize: "11px", fontWeight: "bold", background: scenario === s ? "var(--text)" : "transparent", color: scenario === s ? "var(--bg)" : "var(--text)", borderColor: scenario === s ? "var(--text)" : "var(--border)", cursor: "pointer"}}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === "overview" && <Dashboard navigate={navigate} onAlert={() => setAlertOpen(true)} scenario={scenario} />}
        {screen === "health" && <HealthScreen scenario={scenario} />}
        {screen === "monitoring" && <MonitoringScreen scenario={scenario} />}
        {screen === "insights" && <InsightsScreen scenario={scenario} navigate={navigate} />}
        {screen === "assistant" && <AssistantScreen navigate={navigate} scenario={scenario} />}
        {screen === "alerts" && <AlertsScreen onAlert={() => setAlertOpen(true)} scenario={scenario} />}
        {screen === "emergency" && <EmergencyScreen onSend={() => notify("Priority event queued for immediate transmission.")} />}
        {screen === "control" && <MissionControl onAlert={() => setAlertOpen(true)} scenario={scenario} />}
        {screen === "earth" && <EarthLinkScreen />}
        {screen === "settings" && <SettingsScreen />}
      </div>
      <BottomNavigation active={screen} onNavigate={navigate} />
      {alertOpen && (
        <Modal onClose={() => setAlertOpen(false)} title="Cognitive follow-up required">
          <div className="modal-alert-state">
            <StatusPill value="AMBER" />
            <strong>Attention recommended</strong>
            <p>No immediate danger detected.</p>
          </div>
          <div className="modal-sections">
            <section>
              <span className="eyebrow">WHAT IS HAPPENING</span>
              <p>Your response time was slower than your recent personal baseline across two checks.</p>
            </section>
            <section>
              <span className="eyebrow">WHY WE NOTICED IT</span>
              <p>The change is consistent enough to recommend a brief confirmation check. Accuracy and other health domains remain stable.</p>
            </section>
            <section>
              <span className="eyebrow">WHAT TO DO NOW</span>
              <p>Take a 30-second cognitive check when you are safely able.</p>
            </section>
          </div>
          <div className="modal-actions">
            <SecondaryButton onClick={() => { setAlertOpen(false); navigate("health") }}>View evidence</SecondaryButton>
            <PrimaryButton icon="arrow" onClick={() => { setAlertOpen(false); navigate("health") }}>Start check</PrimaryButton>
          </div>
          <button className="acknowledge-button" onClick={() => { setAlertOpen(false); notify("Alert acknowledged at 10:08 MCT.") }} type="button">
            Acknowledge without starting
          </button>
        </Modal>
      )}
      <Toast show={Boolean(toast)}>{toast}</Toast>
    </div>
  )
}
