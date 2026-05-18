import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../theme";
import { display, body, mono } from "../fonts";

// Pre-baked DRIP vs no-DRIP curves (monthly $)
const YEARS = 20;
const buildSeries = () => {
  const shares = 100, price = 50, yieldPct = 0.06, growth = 0.05;
  const invested = shares * price;
  const drip: number[] = [];
  const flat: number[] = [];
  let bal = invested, y = yieldPct;
  for (let i = 0; i <= YEARS; i++) {
    drip.push((bal * y) / 12);
    flat.push((invested * y) / 12);
    bal += bal * y;
    y *= 1 + growth;
  }
  return { drip, flat };
};
const { drip, flat } = buildSeries();
const maxV = Math.max(...drip);

const W = 1280, H = 520, PAD = 60;
const px = (i: number) => PAD + (i / YEARS) * (W - PAD * 2);
const py = (v: number) => H - PAD - (v / maxV) * (H - PAD * 2);

const pathFor = (arr: number[], cutoff: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= YEARS; i++) {
    const t = Math.max(0, Math.min(1, cutoff - i));
    if (t <= 0) break;
    const v = arr[i - 1] !== undefined && t < 1
      ? arr[i - 1] + (arr[i] - arr[i - 1]) * t
      : arr[i];
    pts.push(`${i === 0 ? "M" : "L"} ${px(i - 1 + t).toFixed(1)} ${py(v).toFixed(1)}`);
  }
  return pts.join(" ");
};

export const SceneDividend: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const chartIn = spring({ frame: frame - 10, fps, config: { damping: 18 } });
  const draw = interpolate(frame, [18, 90], [0, YEARS + 0.01], { extrapolateRight: "clamp" });
  const labelIn = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" });
  const outFade = interpolate(frame, [120, 135], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const dripPath = pathFor(drip, draw);
  const flatPath = pathFor(flat, draw);
  const finalDrip = Math.round(drip[YEARS]);
  const finalFlat = Math.round(flat[YEARS]);

  return (
    <AbsoluteFill style={{ padding: "100px 140px", opacity: outFade, flexDirection: "column" }}>
      <div style={{ opacity: headIn, transform: `translateY(${(1 - headIn) * 20}px)`, marginBottom: 30 }}>
        <div style={{ fontFamily: mono, fontSize: 20, color: colors.primaryGlow, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
          03 · Monthly Dividend Tracker
        </div>
        <div style={{ fontFamily: display, fontSize: 84, fontWeight: 700, color: colors.text, lineHeight: 1, letterSpacing: -1 }}>
          See your <span style={{
            backgroundImage: `linear-gradient(135deg, ${colors.primaryGlow}, ${colors.success})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontStyle: "italic",
          }}>passive income</span> compound.
        </div>
      </div>

      <div style={{
        opacity: chartIn,
        transform: `translateY(${(1 - chartIn) * 30}px)`,
        background: `linear-gradient(135deg, ${colors.surface}, ${colors.bg2})`,
        borderRadius: 28,
        border: `1px solid ${colors.border}`,
        padding: 40,
        boxShadow: `0 30px 80px ${colors.primary}33`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: body, fontSize: 22, color: colors.textDim }}>Projected monthly dividend income</div>
          <div style={{ display: "flex", gap: 28, fontFamily: mono, fontSize: 18 }}>
            <span style={{ color: colors.success }}>● With DRIP</span>
            <span style={{ color: colors.textDim }}>┄ Without DRIP</span>
          </div>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          <defs>
            <linearGradient id="dripFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={colors.success} stopOpacity="0.35" />
              <stop offset="100%" stopColor={colors.success} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={PAD} x2={W - PAD} y1={PAD + i * ((H - PAD * 2) / 4)} y2={PAD + i * ((H - PAD * 2) / 4)} stroke={colors.border} strokeWidth={1} />
          ))}
          {draw > 0.1 && (
            <path d={`${dripPath} L ${px(Math.min(draw, YEARS))} ${H - PAD} L ${PAD} ${H - PAD} Z`} fill="url(#dripFill)" />
          )}
          <path d={flatPath} stroke={colors.textDim} strokeWidth={3} strokeDasharray="8 8" fill="none" strokeLinecap="round" />
          <path d={dripPath} stroke={colors.success} strokeWidth={5} fill="none" strokeLinecap="round" />
          {[0, 5, 10, 15, 20].map((y) => (
            <text key={y} x={px(y)} y={H - 20} fill={colors.textDim} fontSize={18} fontFamily={mono} textAnchor="middle">Y{y}</text>
          ))}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 24, opacity: labelIn }}>
          <Stat label="Today" value="$25/mo" />
          <Stat label="20y · no DRIP" value={`$${finalFlat}/mo`} />
          <Stat label="20y · with DRIP" value={`$${finalDrip.toLocaleString()}/mo`} highlight />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Stat: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontFamily: mono, fontSize: 14, color: colors.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
    <div style={{ fontFamily: mono, fontSize: 38, color: highlight ? colors.success : colors.text, fontWeight: 500 }}>{value}</div>
  </div>
);
