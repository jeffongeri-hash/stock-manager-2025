import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../theme";
import { display, body, mono } from "../fonts";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const urlIn = spring({ frame: frame - 14, fps, config: { damping: 18 } });
  const tagIn = interpolate(frame, [28, 48], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{
        opacity: logoIn,
        transform: `scale(${0.85 + logoIn * 0.15})`,
        fontFamily: display,
        fontSize: 220,
        fontWeight: 700,
        lineHeight: 0.95,
        textAlign: "center",
        letterSpacing: -3,
      }}>
        <span style={{ color: colors.text }}>Profit</span>{" "}
        <span style={{
          backgroundImage: `linear-gradient(135deg, ${colors.primaryGlow}, ${colors.success})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontStyle: "italic",
        }}>Pathfinder</span>
      </div>
      <div style={{
        opacity: tagIn,
        fontFamily: body,
        fontSize: 32,
        color: colors.textDim,
        marginTop: 30,
        letterSpacing: 0.5,
      }}>
        Free calculators. Real strategies. Zero signup.
      </div>
      <div style={{
        opacity: urlIn,
        transform: `translateY(${(1 - urlIn) * 20}px)`,
        marginTop: 60,
        padding: "18px 44px",
        borderRadius: 999,
        border: `1px solid ${colors.primary}66`,
        background: `${colors.primary}1a`,
        fontFamily: mono,
        fontSize: 36,
        color: colors.text,
        letterSpacing: 1,
      }}>
        profitpathfinder.online
      </div>
    </AbsoluteFill>
  );
};
