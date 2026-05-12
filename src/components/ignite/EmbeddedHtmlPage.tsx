import { useEffect, useRef } from "react";

interface Props {
  /** Scoped CSS string (will be injected into a <style> tag inside this page) */
  css: string;
  /** HTML body markup */
  html: string;
  /** Original inline JS to execute after mount */
  script: string;
  /** Optional URL of an external script that must load before `script` runs */
  externalScripts?: string[];
}

/**
 * Renders a verbatim HTML/CSS/JS calculator page (ported from a single-file
 * IgniteFIRE prototype) inside a React route. The original DOM, styles and
 * imperative logic are preserved exactly — we just inject them.
 */
export function EmbeddedHtmlPage({ css, html, script, externalScripts = [] }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loaded: HTMLScriptElement[] = [];

    const loadExternal = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[data-ignite-src="${src}"]`) as HTMLScriptElement | null;
        if (existing) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.dataset.igniteSrc = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
        loaded.push(s);
      });

    (async () => {
      try {
        for (const src of externalScripts) await loadExternal(src);
        if (cancelled) return;
        // Run inline script in global scope so getElementById lookups, event
        // handlers and Chart.js references resolve normally.
        const tag = document.createElement("script");
        tag.textContent = script;
        document.body.appendChild(tag);
        loaded.push(tag);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("EmbeddedHtmlPage script load failed", err);
      }
    })();

    return () => {
      cancelled = true;
      loaded.forEach((s) => s.parentNode?.removeChild(s));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
