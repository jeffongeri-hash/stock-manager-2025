import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { MainVideoVertical } from "./MainVideoVertical";

export const RemotionRoot = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={620}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="vertical"
      component={MainVideoVertical}
      durationInFrames={620}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
