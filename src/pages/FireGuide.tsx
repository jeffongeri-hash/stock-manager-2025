import { EmbeddedHtmlPage } from "@/components/ignite/EmbeddedHtmlPage";
import css from "./ignite-assets/fire-guide.css?raw";
import html from "./ignite-assets/fire-guide.body.html?raw";
import script from "./ignite-assets/fire-guide.script.js?raw";

const FireGuide = () => (
  <EmbeddedHtmlPage
    css={css}
    html={html}
    script={script}
    externalScripts={["/vendor/chart.umd.min.js"]}
  />
);

export default FireGuide;
