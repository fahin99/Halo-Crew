import {
  Area, AreaChart, CartesianGrid, ComposedChart, Line, PolarAngleAxis, PolarGrid,
  Radar, RadarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const INK = "#a89ae8";
export const LILAC = "#8b7ce0";
export const MINT = "#8fc2a2";
export const AMBER = "#ddb273";
export const ROSE = "#d99a9b";
export const SKY = "#7fb0d9";
export const GRID = "rgba(139,124,224,.14)";
export const TICK = "#8f89ad";

const RM = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Tip({ active, payload, label, suffix = "%" }: any) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p: any) => p.name);
  if (!rows.length) return null;
  const title = label ?? payload[0]?.payload?.s ?? payload[0]?.payload?.t ?? "";
  return (
    <div className="chart-tip">
      {title ? <span>{title}</span> : null}
      {rows.map((p: any) => (
        <b key={String(p.dataKey)} style={{ color: p.color || p.stroke || "#d9d1fb" }}>
          {p.name}: {p.value}{suffix}
        </b>
      ))}
    </div>
  );
}

const tipStyle = { cursor: { stroke: "rgba(168,154,232,.35)", strokeWidth: 1 } };

export function Spark({ data, color = LILAC, height = 34 }: { data: number[]; color?: string; height?: number }) {
  const rows = data.map((v, i) => ({ i, v }));
  const gid = `sg-${color.replace("#", "")}`;
  return (
    <div className="spark" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity=".38" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2.4} fill={`url(#${gid})`}
            dot={false} isAnimationActive={!RM} animationDuration={1400} animationEasing="ease-out" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "TODAY"];

const TREND_SETS: Record<string, { v: number[]; b: number; suffix: string; delta: string }> = {
  Stress: { v: [72, 74, 73, 76, 75, 78, 78], b: 74, suffix: "%", delta: "+4% recovery" },
  Sleep: { v: [80, 79, 79, 78, 78, 77, 76], b: 79, suffix: "%", delta: "−12 min vs usual" },
  Focus: { v: [76, 77, 79, 78, 81, 82, 84], b: 78, suffix: "%", delta: "+6% focus" },
  Connection: { v: [85, 86, 85, 87, 88, 88, 89], b: 86, suffix: "%", delta: "+3 moments" },
  Mood: { v: [78, 79, 78, 80, 81, 80, 82], b: 79, suffix: "%", delta: "+2 pts" },
  "Heart rate": { v: [68, 66, 67, 64, 63, 64, 62], b: 65, suffix: " bpm", delta: "−3 bpm resting" },
  "Blood oxygen": { v: [97.6, 98, 97.8, 98.2, 98, 98.1, 98], b: 97.9, suffix: "%", delta: "+0.2 pts" },
  HRV: { v: [42, 44, 43, 46, 45, 47, 48], b: 44, suffix: " ms", delta: "+4 ms recovery" },
};

export function metricSummary(metric: string) {
  const s = TREND_SETS[metric] ?? TREND_SETS.Stress;
  const avg = s.v.reduce((a, b) => a + b, 0) / s.v.length;
  const fmt = (n: number) => `${Math.round(n * 10) / 10}${s.suffix}`;
  return { current: fmt(s.v[s.v.length - 1]), avg: fmt(avg), delta: s.delta };
}

export function Trend({ metric }: { metric: string }) {
  const s = TREND_SETS[metric] ?? TREND_SETS.Stress;
  const rows = DAYS.map((d, i) => ({ d, v: s.v[i], b: s.b }));
  return (
    <div className="trend-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 6, bottom: 0, left: 6 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={LILAC} stopOpacity=".34" />
              <stop offset="1" stopColor={LILAC} stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="d" tick={{ fill: TICK, fontSize: 9, fontWeight: 700 }} tickLine={false} axisLine={false} dy={8} />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip content={<Tip suffix={s.suffix} />} {...tipStyle} />
          <ReferenceLine y={s.b} stroke={AMBER} strokeDasharray="5 6" strokeWidth={1.4} />
          <Area type="monotone" dataKey="v" name={metric} stroke={LILAC} strokeWidth={3.2}
            strokeLinecap="round" fill="url(#trendFill)" dot={false} activeDot={{ r: 5, fill: LILAC, stroke: "#1d1933", strokeWidth: 2 }}
            isAnimationActive={!RM} animationDuration={1600} animationEasing="ease-out" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FutureChart({ scenario }: { scenario: string }) {
  const lift: Record<string, number> = {
    "Recovery break": 0, "Family connection": 2, "Guided breathing": 1,
    "Social interaction": 3, Music: -1, "Sleep support": 4,
  };
  const L = lift[scenario] ?? 0;
  // Endpoint-anchored pills: plot top pad 10px, XAxis 30px, domain [30,95], wrap 322px.
  const yOf = (v: number) => ((10 + ((95 - v) / 65) * 282) / 322) * 100;
  const rows = [
    { t: "NOW", low: 64, span: 9, without: 69, with: 69 + L },
    { t: "+6H", low: 60, span: 10, without: 66, with: 72 + L },
    { t: "+12H", low: 55, span: 11, without: 62, with: 75 + L },
    { t: "+24H", low: 49, span: 12, without: 56, with: 79 + L },
    { t: "+48H", low: 42, span: 13, without: 50, with: 83 + L },
  ];
  return (
    <div className="future-wrap">
      <div className="future-label no-change" style={{ top: `${yOf(50)}%` }}><i />If nothing changes</div>
      <div className="future-label intervention" style={{ top: `${yOf(83 + L)}%` }}><i />If I take a {scenario.toLowerCase()}</div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="t" tick={{ fill: TICK, fontSize: 9, fontWeight: 700 }} tickLine={false} axisLine={false} dy={8} />
          <YAxis hide domain={[30, 95]} />
          <Tooltip content={<Tip suffix="" />} {...tipStyle} />
          <Area dataKey="low" stackId="band" stroke="none" fill="none" name="" isAnimationActive={false} />
          <Area dataKey="span" stackId="band" stroke="none" fill="rgba(217,154,155,.16)" name="" isAnimationActive={false} />
          <Line type="monotone" dataKey="without" name="Without change" stroke={ROSE} strokeWidth={3}
            strokeLinecap="round" dot={{ r: 3.5, fill: ROSE, strokeWidth: 0 }} activeDot={{ r: 5 }}
            isAnimationActive={!RM} animationDuration={1600} animationEasing="ease-out" />
          <Line type="monotone" dataKey="with" name="With support" stroke={MINT} strokeWidth={3}
            strokeLinecap="round" dot={{ r: 3.5, fill: MINT, strokeWidth: 0 }} activeDot={{ r: 5 }}
            isAnimationActive={!RM} animationDuration={1600} animationEasing="ease-out" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const MODEL = [
  { s: "Stress", base: 72, now: 64 },
  { s: "Sleep", base: 82, now: 73 },
  { s: "Focus", base: 75, now: 80 },
  { s: "Social", base: 68, now: 76 },
  { s: "Recovery", base: 78, now: 69 },
  { s: "Mood", base: 81, now: 79 },
];

export function ModelRadar() {
  return <ConditionRadar data={MODEL} height={430} />;
}

const BODY = [
  { s: "Resting HR", base: 74, now: 78 },
  { s: "Blood oxygen", base: 95, now: 96 },
  { s: "HRV", base: 70, now: 76 },
];

export function BodyRadar() {
  return <ConditionRadar data={BODY} height={300} radius="68%" />;
}

function ConditionRadar({ data, height, radius = "72%" }: { data: typeof MODEL; height: number; radius?: string }) {
  return (
    <div className="radar-wrap" style={{ height, maxWidth: height > 350 ? 560 : 420, margin: "auto" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius={radius}>
          <PolarGrid stroke="rgba(139,124,224,.25)" />
          <PolarAngleAxis dataKey="s" tick={{ fill: TICK, fontSize: 10, fontWeight: 700 }} />
          <Tooltip content={<Tip />} />
          <Radar dataKey="base" name="Baseline" stroke={LILAC} strokeWidth={2} strokeDasharray="5 4"
            fill={LILAC} fillOpacity={.1} dot={{ r: 2.5, fill: LILAC, strokeWidth: 0 }}
            isAnimationActive={!RM} animationDuration={1500} animationEasing="ease-out" />
          <Radar dataKey="now" name="Current" stroke={INK} strokeWidth={2.6}
            fill={INK} fillOpacity={.3} dot={{ r: 3.5, fill: "#efe9ff", stroke: INK, strokeWidth: 2 }}
            isAnimationActive={!RM} animationDuration={1500} animationEasing="ease-out" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
