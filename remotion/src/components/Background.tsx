import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors } from "./theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 600], [0, 60]);
  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <AbsoluteFill style={{
        background: `radial-gradient(900px 700px at ${20 + drift}% ${30 - drift * 0.3}%, ${colors.primary}55, transparent 60%),
                     radial-gradient(800px 600px at ${85 - drift * 0.4}% ${75 + drift * 0.2}%, ${colors.success}33, transparent 60%),
                     radial-gradient(700px 500px at ${50}% ${50}%, ${colors.accent}1a, transparent 70%)`,
        filter: "blur(2px)",
      }} />
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(${colors.border} 1px, transparent 1px), linear-gradient(90deg, ${colors.border} 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
        opacity: 0.25,
        transform: `translate(${-drift * 0.5}px, ${-drift * 0.3}px)`,
      }} />
    </AbsoluteFill>
  );
};
