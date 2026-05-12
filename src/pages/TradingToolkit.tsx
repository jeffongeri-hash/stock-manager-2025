import { EmbeddedHtmlPage } from "@/components/ignite/EmbeddedHtmlPage";
import css from "./ignite-assets/trading-toolkit.css?raw";
import html from "./ignite-assets/trading-toolkit.body.html?raw";
import script from "./ignite-assets/trading-toolkit.script.js?raw";

const TradingToolkit = () => (
  <EmbeddedHtmlPage
    css={css}
    html={html}
    script={script}
    externalScripts={["https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"]}
  />
);

export default TradingToolkit;
