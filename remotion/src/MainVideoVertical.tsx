import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Background } from "./components/Background";
import { SceneIntro } from "./scenes/SceneIntro";
import { SceneCoastFire } from "./scenes/SceneCoastFire";
import { SceneCoveredCall } from "./scenes/SceneCoveredCall";
import { SceneDividend } from "./scenes/SceneDividend";
import { SceneOutro } from "./scenes/SceneOutro";

const T = springTiming({ config: { damping: 200 }, durationInFrames: 20 });

// 1080x1920 canvas. Embed the 1920x1080 scenes by scaling to fit width (scale = 1080/1920 = 0.5625),
// resulting in a 1080x608 inner area centered vertically. Surrounding space stays on the brand background.
const SCALE = 1080 / 1920;
const INNER_W = 1920;
const INNER_H = 1080;

const Scale: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{
      width: INNER_W,
      height: INNER_H,
      transform: `scale(${SCALE})`,
      transformOrigin: "center center",
      position: "relative",
    }}>
      {children}
    </div>
  </AbsoluteFill>
);

export const MainVideoVertical: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={110}>
          <Scale><SceneIntro /></Scale>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={130}>
          <Scale><SceneCoastFire /></Scale>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={130}>
          <Scale><SceneCoveredCall /></Scale>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={140}>
          <Scale><SceneDividend /></Scale>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={190}>
          {/* Outro uses native vertical layout for the CTA */}
          <SceneOutro vertical />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
