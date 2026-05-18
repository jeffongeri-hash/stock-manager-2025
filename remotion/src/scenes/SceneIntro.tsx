import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import { colors } from "../theme";
import { display, body } from "../fonts";

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const subFade = interpolate(frame, [18, 36], [0, 1], { extrapolateRight: "clamp" });
  const badgeIn = spring({ frame: frame - 4, fps, config: { damping: 20 } });
  const outFade = interpolate(frame, [80, 95], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: outFade }}>
      <div style={{
        opacity: badgeIn,
        transform: `translateY(${(1 - badgeIn) * 20}px)`,
        padding: "10px 22px",
        borderRadius: 999,
        border: `1px solid ${colors.primary}66`,
        background: `${colors.primary}1a`,
        color: colors.primaryGlow,
        fontFamily: body,
        fontSize: 22,
        letterSpacing: 2,
        textTransform: "uppercase",
        marginBottom: 36,
      }}>
        Profit Pathfinder
      </div>
      <div style={{
        transform: `translateY(${(1 - titleY) * 50}px)`,
        opacity: titleY,
        fontFamily: display,
        fontSize: 180,
        fontWeight: 700,
        color: colors.text,
        lineHeight: 0.95,
        textAlign: "center",
        letterSpacing: -2,
      }}>
        Plan your
        <br />
        <span style={{
          backgroundImage: `linear-gradient(135deg, ${colors.primaryGlow}, ${colors.success})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontStyle: "italic",
        }}>financial freedom.</span>
      </div>
      <div style={{
        opacity: subFade,
        fontFamily: body,
        fontSize: 30,
        color: colors.textDim,
        marginTop: 40,
        letterSpacing: 0.5,
      }}>
        Free, professional calculators for FIRE, options & dividends.
      </div>
    </AbsoluteFill>
  );
};
