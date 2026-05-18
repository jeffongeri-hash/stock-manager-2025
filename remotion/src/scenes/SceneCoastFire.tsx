import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../theme";
import { display, body, mono } from "../fonts";

export const SceneCoastFire: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardIn = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const numberFrame = Math.max(0, frame - 10);
  const animatedNum = Math.round(interpolate(numberFrame, [0, 50], [0, 487320], { extrapolateRight: "clamp" }));
  const barProgress = interpolate(frame, [20, 70], [0, 0.72], { extrapolateRight: "clamp" });
  const labelIn = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const outFade = interpolate(frame, [110, 125], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ padding: "120px 140px", opacity: outFade }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{
          opacity: labelIn,
          transform: `translateX(${(1 - labelIn) * -20}px)`,
        }}>
          <div style={{ fontFamily: mono, fontSize: 20, color: colors.success, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>
            01 · Coast FIRE Calculator
          </div>
          <div style={{ fontFamily: display, fontSize: 96, fontWeight: 700, color: colors.text, lineHeight: 1, letterSpacing: -1 }}>
            Know when you can
            <br />
            <span style={{
              backgroundImage: `linear-gradient(135deg, ${colors.success}, ${colors.primaryGlow})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontStyle: "italic",
            }}>stop saving.</span>
          </div>
        </div>

        <div style={{
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 40}px) scale(${0.95 + cardIn * 0.05})`,
          marginTop: 30,
          background: `linear-gradient(135deg, ${colors.surface}, ${colors.bg2})`,
          borderRadius: 28,
          border: `1px solid ${colors.border}`,
          padding: "50px 60px",
          boxShadow: `0 30px 80px ${colors.primary}33`,
          maxWidth: 1100,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 30 }}>
            <div style={{ fontFamily: body, fontSize: 24, color: colors.textDim, letterSpacing: 1 }}>
              Coast FIRE Number
            </div>
            <div style={{ fontFamily: mono, fontSize: 22, color: colors.success }}>
              ▲ on track
            </div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 140, fontWeight: 500, color: colors.text, letterSpacing: -3, lineHeight: 1 }}>
            ${animatedNum.toLocaleString()}
          </div>
          <div style={{ marginTop: 40, height: 18, background: `${colors.border}`, borderRadius: 12, overflow: "hidden", border: `1px solid ${colors.border}` }}>
            <div style={{
              width: `${barProgress * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.success})`,
              borderRadius: 12,
              boxShadow: `0 0 30px ${colors.primary}aa`,
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontFamily: mono, fontSize: 20, color: colors.textDim }}>
            <span>Age 34 · today</span>
            <span style={{ color: colors.text }}>{Math.round(barProgress * 100)}%</span>
            <span>Age 47 · Coast FIRE</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
