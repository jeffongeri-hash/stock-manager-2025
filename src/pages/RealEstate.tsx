import { EmbeddedHtmlPage } from "@/components/ignite/EmbeddedHtmlPage";
import css from "./ignite-assets/real-estate.css?raw";
import html from "./ignite-assets/real-estate.body.html?raw";
import script from "./ignite-assets/real-estate.script.js?raw";

const RealEstate = () => (
  <EmbeddedHtmlPage
    css={css}
    html={html}
    script={script}
    externalScripts={["https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"]}
  />
);

export default RealEstate;
