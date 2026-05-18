import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../theme";
import { display, body, mono } from "../fonts";

const Row: React.FC<{ label: string; value: string; accent?: boolean; delay: number }> = ({ label, value, accent, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div style={{
      opacity: s,
      transform: `translateX(${(1 - s) * 30}px)`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "22px 0",
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <span style={{ fontFamily: body, fontSize: 28, color: colors.textDim }}>{label}</span>
      <span style={{
        fontFamily: mono,
        fontSize: accent ? 42 : 32,
        color: accent ? colors.success : colors.text,
        fontWeight: 500,
      }}>{value}</span>
    </div>
  );
};

export const SceneCoveredCall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const cardIn = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  const outFade = interpolate(frame, [110, 125], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ padding: "120px 140px", opacity: outFade, flexDirection: "row", gap: 80, alignItems: "center" }}>
      <div style={{ flex: 1, opacity: headIn, transform: `translateY(${(1 - headIn) * 30}px)` }}>
        <div style={{ fontFamily: mono, fontSize: 20, color: colors.accent, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>
          02 · Covered Call Calculator
        </div>
        <div style={{ fontFamily: display, fontSize: 92, fontWeight: 700, color: colors.text, lineHeight: 1, letterSpacing: -1 }}>
          Turn shares into
          <br />
          <span style={{
            backgroundImage: `linear-gradient(135deg, ${colors.accent}, ${colors.primaryGlow})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontStyle: "italic",
          }}>monthly income.</span>
        </div>
        <div style={{ fontFamily: body, fontSize: 26, color: colors.textDim, marginTop: 30, lineHeight: 1.4 }}>
          Premium, annualized yield, breakeven, and rolling — all in one place.
        </div>
      </div>

      <div style={{
        flex: 1,
        opacity: cardIn,
        transform: `translateY(${(1 - cardIn) * 40}px) scale(${0.95 + cardIn * 0.05})`,
        background: `linear-gradient(135deg, ${colors.surface}, ${colors.bg2})`,
        borderRadius: 28,
        border: `1px solid ${colors.border}`,
        padding: "44px 50px",
        boxShadow: `0 30px 80px ${colors.accent}22`,
      }}>
        <div style={{ fontFamily: body, fontSize: 22, color: colors.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          AAPL · 30 DTE · $200 strike
        </div>
        <Row label="Premium collected" value="$485" delay={12} />
        <Row label="Static return" value="2.4%" delay={20} />
        <Row label="Annualized yield" value="29.2%" accent delay={28} />
        <Row label="Breakeven" value="$192.65" delay={36} />
        <Row label="Downside protection" value="3.7%" delay={44} />
      </div>
    </AbsoluteFill>
  );
};
