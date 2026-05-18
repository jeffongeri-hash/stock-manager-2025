import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../theme";
import { display, body, mono } from "../fonts";

interface Props {
  vertical?: boolean;
}

export const SceneOutro: React.FC<Props> = ({ vertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const tagIn = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: "clamp" });
  const ctaIn = spring({ frame: frame - 36, fps, config: { damping: 14, stiffness: 130 } });
  // Pulse + shimmer on CTA after it lands
  const pulse = interpolate(frame, [60, 75, 90, 105], [1, 1.06, 1, 1.04], { extrapolateRight: "extend" });
  const shimmerX = interpolate(frame, [60, 130], [-1.2, 1.2], { extrapolateRight: "clamp" });
  const urlIn = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" });

  const logoSize = vertical ? 130 : 200;
  const tagSize = vertical ? 30 : 32;
  const ctaSize = vertical ? 44 : 56;
  const ctaPadV = vertical ? 24 : 30;
  const ctaPadH = vertical ? 50 : 80;
  const urlSize = vertical ? 26 : 32;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: vertical ? 60 : 0 }}>
      <div style={{
        opacity: logoIn,
        transform: `scale(${0.85 + logoIn * 0.15})`,
        fontFamily: display,
        fontSize: logoSize,
        fontWeight: 700,
        lineHeight: 0.95,
        textAlign: "center",
        letterSpacing: -3,
      }}>
        <span style={{ color: colors.text }}>Profit</span>{vertical ? <br /> : " "}
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
        fontSize: tagSize,
        color: colors.textDim,
        marginTop: 26,
        letterSpacing: 0.5,
        textAlign: "center",
      }}>
        Free calculators. Real strategies. Zero signup.
      </div>

      {/* CTA button */}
      <div style={{
        opacity: ctaIn,
        transform: `translateY(${(1 - ctaIn) * 30}px) scale(${pulse})`,
        marginTop: vertical ? 50 : 70,
        position: "relative",
        padding: `${ctaPadV}px ${ctaPadH}px`,
        borderRadius: 999,
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.success})`,
        boxShadow: `0 20px 60px ${colors.primary}aa, 0 0 0 1px ${colors.primaryGlow}66`,
        fontFamily: body,
        fontSize: ctaSize,
        fontWeight: 700,
        color: "#ffffff",
        letterSpacing: 0.5,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}>
        {/* Shimmer */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: `translateX(${shimmerX * 100}%)`,
          background: `linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%)`,
          pointerEvents: "none",
        }} />
        <span style={{ position: "relative" }}>Try the calculators</span>
        <span style={{
          position: "relative",
          fontSize: ctaSize * 0.9,
          transform: `translateX(${interpolate(frame, [60, 75, 90, 105], [0, 8, 0, 6], { extrapolateRight: "extend" })}px)`,
          display: "inline-block",
        }}>→</span>
      </div>

      <div style={{
        opacity: urlIn,
        transform: `translateY(${(1 - urlIn) * 14}px)`,
        marginTop: vertical ? 30 : 36,
        fontFamily: mono,
        fontSize: urlSize,
        color: colors.primaryGlow,
        letterSpacing: 2,
      }}>
        profitpathfinder.online
      </div>
    </AbsoluteFill>
  );
};
