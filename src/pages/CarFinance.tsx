import { EmbeddedHtmlPage } from "@/components/ignite/EmbeddedHtmlPage";
import css from "./ignite-assets/car-finance.css?raw";
import html from "./ignite-assets/car-finance.body.html?raw";
import script from "./ignite-assets/car-finance.script.js?raw";

const CarFinance = () => (
  <EmbeddedHtmlPage
    css={css}
    html={html}
    script={script}
    externalScripts={["https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"]}
  />
);

export default CarFinance;
