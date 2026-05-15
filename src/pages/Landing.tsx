import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EmbeddedHtmlPage } from "@/components/ignite/EmbeddedHtmlPage";
import css from "./landing-assets/landing.css?raw";
import body from "./landing-assets/landing.body.html?raw";
import script from "./landing-assets/landing.script.js?raw";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string") navigate(detail);
    };
    window.addEventListener("lovable-navigate", handler);
    return () => window.removeEventListener("lovable-navigate", handler);
  }, [navigate]);

  return <EmbeddedHtmlPage css={css} html={body} script={script} />;
};

export default Landing;
