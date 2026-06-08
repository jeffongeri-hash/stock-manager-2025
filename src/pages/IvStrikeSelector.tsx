import { useState, useCallback, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MODES = ["LEAPS", "0DTE", "BOTH"];
const INTRADAY_CONDITIONS = ["Trend Day Up", "Trend Day Down", "Range Day", "Event / Unknown"];
const IV_REGIMES = ["Low (<25%)", "Moderate (25–40%)", "High (40–60%)", "Extreme (>60%)"];

// ─── MATH HELPERS ─────────────────────────────────────────────────────────────
function calcDailyEM(price, iv) {
  return price * (iv / 100) / Math.sqrt(252);
}
function calcWeeklyEM(price, iv) {
  return price * (iv / 100) * Math.sqrt(5 / 252);
}
function calcMonthlyEM(price, iv) {
  return price * (iv / 100) * Math.sqrt(30 / 365);
}
function calcLEAPSEM(price, iv, years) {
  return price * (iv / 100) * Math.sqrt(years);
}
function calcIVRank(current, low, high) {
  if (high === low) return 50;
  return Math.round(((current - low) / (high - low)) * 100);
}
function calcExtrinsicBurden(price, strike, premium, years) {
  const intrinsic = Math.max(price - strike, 0);
  const extrinsic = premium - intrinsic;
  const annualBurden = years > 0 ? extrinsic / years : extrinsic;
  return { intrinsic, extrinsic, annualBurden, pct: (annualBurden / price) * 100 };
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #050810;
    --bg1:     #090D1A;
    --bg2:     #0D1220;
    --bg3:     #111827;
    --border:  #1a2340;
    --border2: #212d45;
    --accent:  #00D4FF;
    --accent2: #0099bb;
    --green:   #00E5A0;
    --red:     #FF4560;
    --yellow:  #FFB800;
    --purple:  #A855F7;
    --text:    #E2EAF4;
    --text2:   #7A90B0;
    --text3:   #3D5070;
    --mono:    'DM Mono', monospace;
    --sans:    'Syne', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--sans); }

  .root {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    flex-direction: column;
  }

  /* HEADER */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px;
    background: var(--bg1);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 100;
  }
  .header-brand { display: flex; align-items: center; gap: 10px; }
  .brand-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 10px var(--accent);
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .brand-label { font-family: var(--mono); font-size: 10px; color: var(--text2); letter-spacing: 0.2em; }
  .brand-title { font-size: 16px; font-weight: 800; color: var(--text); letter-spacing: -0.01em; }
  .brand-title span { color: var(--accent); }
  .header-badge {
    font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em;
    color: var(--accent); background: rgba(0,212,255,0.08);
    border: 1px solid rgba(0,212,255,0.2); border-radius: 4px; padding: 3px 9px;
  }

  /* LAYOUT */
  .layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    min-height: calc(100vh - 53px);
  }

  /* LEFT PANEL */
  .left-panel {
    background: var(--bg1);
    border-right: 1px solid var(--border);
    padding: 20px;
    overflow-y: auto;
    display: flex; flex-direction: column; gap: 16px;
  }

  .panel-section { display: flex; flex-direction: column; gap: 10px; }
  .panel-section-title {
    font-family: var(--mono); font-size: 9px; font-weight: 500;
    color: var(--text3); letter-spacing: 0.2em; text-transform: uppercase;
    padding-bottom: 6px; border-bottom: 1px solid var(--border);
  }

  /* INPUTS */
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field label { font-family: var(--mono); font-size: 9px; color: var(--text2); letter-spacing: 0.1em; }
  .field input, .field select {
    background: var(--bg2); border: 1px solid var(--border2);
    color: var(--text); font-family: var(--mono); font-size: 13px;
    padding: 8px 12px; border-radius: 6px; outline: none; width: 100%;
    transition: border-color 0.15s;
  }
  .field input:focus, .field select:focus { border-color: var(--accent); }
  .field input::placeholder { color: var(--text3); }

  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .field-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }

  /* MODE TABS */
  .mode-tabs { display: flex; gap: 4px; }
  .mode-tab {
    flex: 1; padding: 7px 4px; border-radius: 6px; border: 1px solid var(--border2);
    background: var(--bg2); color: var(--text2); cursor: pointer;
    font-family: var(--mono); font-size: 10px; font-weight: 500; letter-spacing: 0.08em;
    transition: all 0.15s; text-align: center;
  }
  .mode-tab.active { background: rgba(0,212,255,0.1); border-color: var(--accent); color: var(--accent); }
  .mode-tab:hover:not(.active) { border-color: var(--border2); color: var(--text); }

  /* EM DISPLAY */
  .em-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .em-card {
    background: var(--bg2); border: 1px solid var(--border); border-radius: 8px;
    padding: 9px 11px;
  }
  .em-card-label { font-family: var(--mono); font-size: 8px; color: var(--text3); letter-spacing: 0.1em; margin-bottom: 3px; }
  .em-card-value { font-family: var(--mono); font-size: 14px; font-weight: 500; color: var(--accent); }
  .em-card-sub { font-family: var(--mono); font-size: 9px; color: var(--text3); margin-top: 2px; }

  /* IV RANK BAR */
  .iv-rank-bar {
    height: 6px; border-radius: 3px; background: var(--bg3); overflow: hidden; margin-top: 4px;
  }
  .iv-rank-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }

  /* STATUS TAG */
  .status-tag {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: var(--mono); font-size: 9px; font-weight: 500; letter-spacing: 0.1em;
    padding: 3px 9px; border-radius: 20px;
  }
  .tag-green  { background: rgba(0,229,160,0.1);  color: var(--green);  border: 1px solid rgba(0,229,160,0.25); }
  .tag-red    { background: rgba(255,69,96,0.1);  color: var(--red);    border: 1px solid rgba(255,69,96,0.25); }
  .tag-yellow { background: rgba(255,184,0,0.1);  color: var(--yellow); border: 1px solid rgba(255,184,0,0.25); }
  .tag-blue   { background: rgba(0,212,255,0.1);  color: var(--accent); border: 1px solid rgba(0,212,255,0.25); }
  .tag-purple { background: rgba(168,85,247,0.1); color: var(--purple); border: 1px solid rgba(168,85,247,0.25); }

  /* FETCH BTN */
  .fetch-btn {
    width: 100%; padding: 11px; border-radius: 8px; border: none; cursor: pointer;
    background: rgba(0,212,255,0.12); border: 1px solid rgba(0,212,255,0.3);
    color: var(--accent); font-family: var(--mono); font-size: 11px; font-weight: 500;
    letter-spacing: 0.1em; transition: all 0.15s; display: flex; align-items: center;
    justify-content: center; gap: 7px;
  }
  .fetch-btn:hover { background: rgba(0,212,255,0.2); }
  .fetch-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .analyze-btn {
    width: 100%; padding: 13px; border-radius: 8px; border: none; cursor: pointer;
    background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,153,187,0.15));
    border: 1px solid rgba(0,212,255,0.4); color: var(--accent);
    font-family: var(--sans); font-size: 13px; font-weight: 700;
    letter-spacing: 0.04em; transition: all 0.2s;
    box-shadow: 0 0 20px rgba(0,212,255,0.08);
  }
  .analyze-btn:hover { background: linear-gradient(135deg, rgba(0,212,255,0.3), rgba(0,153,187,0.25)); box-shadow: 0 0 30px rgba(0,212,255,0.15); }
  .analyze-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* RIGHT PANEL */
  .right-panel {
    background: var(--bg);
    padding: 24px;
    overflow-y: auto;
    display: flex; flex-direction: column; gap: 20px;
  }

  /* EMPTY STATE */
  .empty-state {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; opacity: 0.4;
    text-align: center; padding: 60px 20px;
  }
  .empty-icon { font-size: 48px; }
  .empty-title { font-size: 18px; font-weight: 700; color: var(--text2); }
  .empty-sub { font-family: var(--mono); font-size: 11px; color: var(--text3); line-height: 1.7; }

  /* TICKER HERO */
  .ticker-hero {
    display: flex; align-items: flex-start; justify-content: space-between;
    background: var(--bg1); border: 1px solid var(--border); border-radius: 12px;
    padding: 18px 22px; gap: 16px; flex-wrap: wrap;
  }
  .ticker-name { font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
  .ticker-price { font-family: var(--mono); font-size: 22px; font-weight: 500; color: var(--accent); }
  .ticker-meta { font-family: var(--mono); font-size: 10px; color: var(--text3); margin-top: 3px; }
  .ticker-stats { display: flex; gap: 20px; align-items: flex-end; }
  .ticker-stat { text-align: right; }
  .ticker-stat-label { font-family: var(--mono); font-size: 8px; color: var(--text3); letter-spacing: 0.1em; margin-bottom: 2px; }
  .ticker-stat-val { font-family: var(--mono); font-size: 13px; font-weight: 500; }

  /* STRIKE MAP */
  .strike-map-wrap {
    background: var(--bg1); border: 1px solid var(--border); border-radius: 12px;
    padding: 18px 22px;
  }
  .strike-map-title {
    font-family: var(--mono); font-size: 9px; color: var(--text3); letter-spacing: 0.18em;
    text-transform: uppercase; margin-bottom: 14px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .strike-map-axis {
    display: flex; align-items: stretch; gap: 0;
    position: relative; height: 56px;
    background: var(--bg2); border-radius: 8px; overflow: hidden;
    border: 1px solid var(--border);
  }
  .strike-segment {
    flex: 1; display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 2px; position: relative;
    border-right: 1px solid var(--border); cursor: default;
    transition: background 0.15s;
    padding: 4px 2px;
  }
  .strike-segment:last-child { border-right: none; }
  .strike-segment.spot { background: rgba(0,212,255,0.1); }
  .strike-segment.recommended { background: rgba(0,229,160,0.08); }
  .strike-segment.caution { background: rgba(255,184,0,0.06); }
  .strike-segment.avoid { background: rgba(255,69,96,0.05); }
  .seg-label { font-family: var(--mono); font-size: 8px; color: var(--text3); }
  .seg-strike { font-family: var(--mono); font-size: 11px; font-weight: 500; color: var(--text); }
  .seg-em { font-family: var(--mono); font-size: 8px; color: var(--text3); }
  .seg-dot { width: 6px; height: 6px; border-radius: 50%; }

  /* RECOMMENDATION CARDS */
  .rec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .rec-card {
    background: var(--bg1); border-radius: 12px; overflow: hidden;
    border: 1px solid var(--border);
  }
  .rec-card-head {
    padding: 12px 16px; display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid var(--border);
  }
  .rec-card-type { font-size: 13px; font-weight: 700; }
  .rec-card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
  .rec-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .rec-row-label { font-family: var(--mono); font-size: 9px; color: var(--text3); letter-spacing: 0.08em; padding-top: 1px; }
  .rec-row-val { font-family: var(--mono); font-size: 11px; color: var(--text); font-weight: 500; text-align: right; max-width: 60%; }
  .rec-divider { height: 1px; background: var(--border); }

  /* GREEKS TABLE */
  .greeks-table { width: 100%; border-collapse: collapse; }
  .greeks-table th {
    font-family: var(--mono); font-size: 8px; color: var(--text3); letter-spacing: 0.12em;
    text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--border); font-weight: 500;
  }
  .greeks-table td {
    font-family: var(--mono); font-size: 11px; color: var(--text); padding: 7px 10px;
    border-bottom: 1px solid var(--border);
  }
  .greeks-table tr:last-child td { border-bottom: none; }
  .greeks-table tr:hover td { background: rgba(255,255,255,0.02); }
  .greek-bar-cell { width: 80px; }
  .greek-bar { height: 4px; border-radius: 2px; background: var(--bg3); }
  .greek-bar-fill { height: 100%; border-radius: 2px; }

  /* AI ANALYSIS */
  .ai-analysis {
    background: var(--bg1); border: 1px solid var(--border); border-radius: 12px;
    overflow: hidden;
  }
  .ai-analysis-head {
    padding: 14px 18px; background: rgba(0,212,255,0.05);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .ai-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; }
  .ai-label { font-family: var(--mono); font-size: 9px; color: var(--accent); letter-spacing: 0.15em; }
  .ai-body { padding: 18px; font-size: 13px; color: var(--text2); line-height: 1.8; }
  .ai-body strong { color: var(--text); font-weight: 700; }
  .ai-body .highlight { color: var(--accent); font-weight: 600; }
  .ai-body .warn { color: var(--yellow); font-weight: 600; }
  .ai-body .danger { color: var(--red); font-weight: 600; }
  .ai-body .good { color: var(--green); font-weight: 600; }

  /* CHECKLIST */
  .checklist { display: flex; flex-direction: column; gap: 6px; }
  .check-item {
    display: flex; align-items: flex-start; gap: 10px;
    background: var(--bg2); border-radius: 7px; padding: 9px 12px;
    border: 1px solid var(--border);
  }
  .check-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
  .check-text { font-family: var(--mono); font-size: 11px; color: var(--text2); line-height: 1.6; }
  .check-text strong { color: var(--text); }

  /* LOADING */
  .loading-ring {
    width: 18px; height: 18px; border: 2px solid rgba(0,212,255,0.2);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .streaming-cursor {
    display: inline-block; width: 2px; height: 14px;
    background: var(--accent); margin-left: 2px; vertical-align: middle;
    animation: blink 0.8s step-end infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* SECTION HEADER */
  .section-hdr {
    display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
  }
  .section-hdr-line { flex: 1; height: 1px; background: var(--border); }
  .section-hdr-text { font-family: var(--mono); font-size: 9px; color: var(--text3); letter-spacing: 0.18em; white-space: nowrap; }

  /* DISCLAIMER */
  .disclaimer {
    font-family: var(--mono); font-size: 9px; color: var(--text3);
    line-height: 1.6; text-align: center; padding: 8px 0;
  }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  /* API KEY notice */
  .api-notice {
    background: rgba(255,184,0,0.06); border: 1px solid rgba(255,184,0,0.2);
    border-radius: 7px; padding: 9px 12px;
    font-family: var(--mono); font-size: 9px; color: var(--yellow); line-height: 1.7;
  }
`;

// ─── STRIKE MAP COMPONENT ─────────────────────────────────────────────────────
function StrikeMap({ spot, ivPct, mode, dailyEM, monthlyEM, leapsYears }) {
  const em = mode === "0DTE" ? dailyEM : mode === "LEAPS" ? calcLEAPSEM(spot, ivPct, leapsYears || 1.5) : monthlyEM;

  const segments = [
    { label: "-2.0 EM", strike: spot - 2 * em, type: "avoid" },
    { label: "-1.5 EM", strike: spot - 1.5 * em, type: "caution" },
    { label: "-1.0 EM", strike: spot - em, type: "caution" },
    { label: "-0.5 EM", strike: spot - 0.5 * em, type: "recommended" },
    { label: "SPOT",    strike: spot,              type: "spot" },
    { label: "+0.5 EM", strike: spot + 0.5 * em,  type: "recommended" },
    { label: "+1.0 EM", strike: spot + em,         type: "caution" },
    { label: "+1.5 EM", strike: spot + 1.5 * em,  type: "caution" },
    { label: "+2.0 EM", strike: spot + 2 * em,    type: "avoid" },
  ];

  const dotColors = { spot: "#00D4FF", recommended: "#00E5A0", caution: "#FFB800", avoid: "#FF4560" };

  return (
    <div className="strike-map-wrap">
      <div className="strike-map-title">
        <span>STRIKE MAP — EXPECTED MOVE GRID</span>
        <span style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontSize: "10px" }}>
          1 EM = ${em.toFixed(2)}
        </span>
      </div>
      <div className="strike-map-axis">
        {segments.map((s, i) => (
          <div key={i} className={`strike-segment ${s.type}`}>
            <div className="seg-label">{s.label}</div>
            <div className="seg-strike">${s.strike.toFixed(1)}</div>
            <div className="seg-dot" style={{ background: dotColors[s.type] }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
        {[["#00E5A0","Preferred Strike Zone"],["#FFB800","Caution / Spread Boundary"],["#FF4560","Avoid / Lottery Exposure"],["#00D4FF","Current Spot"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text3)" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── METRICS CARDS ────────────────────────────────────────────────────────────
function EMCards({ spot, ivPct, leapsYears }) {
  return (
    <div className="em-grid">
      {[
        { label: "DAILY EM (0DTE)", val: calcDailyEM(spot, ivPct), range: `$${(spot - calcDailyEM(spot, ivPct)).toFixed(2)} – $${(spot + calcDailyEM(spot, ivPct)).toFixed(2)}` },
        { label: "WEEKLY EM", val: calcWeeklyEM(spot, ivPct), range: `$${(spot - calcWeeklyEM(spot, ivPct)).toFixed(2)} – $${(spot + calcWeeklyEM(spot, ivPct)).toFixed(2)}` },
        { label: "MONTHLY EM (30D)", val: calcMonthlyEM(spot, ivPct), range: `$${(spot - calcMonthlyEM(spot, ivPct)).toFixed(2)} – $${(spot + calcMonthlyEM(spot, ivPct)).toFixed(2)}` },
        { label: `LEAPS EM (${leapsYears || 1.5}yr)`, val: calcLEAPSEM(spot, ivPct, leapsYears || 1.5), range: `1-SD cone for LEAPS horizon` },
      ].map(c => (
        <div key={c.label} className="em-card">
          <div className="em-card-label">{c.label}</div>
          <div className="em-card-value">${c.val.toFixed(2)}</div>
          <div className="em-card-sub">{c.range}</div>
        </div>
      ))}
    </div>
  );
}

// ─── GREEKS TABLE ─────────────────────────────────────────────────────────────
function GreeksTable({ mode, ivPct }) {
  const rows = mode === "0DTE"
    ? [
        { greek: "Gamma", importance: 5, note: "Critical — ATM gamma explodes near expiry", color: "#FF4560" },
        { greek: "Theta", importance: 5, note: "Severe — entire extrinsic can decay in one session", color: "#FF4560" },
        { greek: "Delta", importance: 5, note: "Must align with immediate intraday direction", color: "#FFB800" },
        { greek: "Execution", importance: 5, note: "Slippage destroys edge — use limit orders only", color: "#FF4560" },
        { greek: "Vega", importance: 2, note: "Lower duration — intraday IV shifts still matter", color: "#00D4FF" },
      ]
    : [
        { greek: "Delta", importance: 5, note: "Primary driver — deep ITM mimics stock ownership", color: "#00E5A0" },
        { greek: "Vega", importance: 5, note: "Long-dated options are highly sensitive to IV changes", color: "#FFB800" },
        { greek: "Theta", importance: 3, note: "Lower daily drag but extrinsic burden matters cumulatively", color: "#00D4FF" },
        { greek: "Gamma", importance: 2, note: "Lower relative importance with long time horizon", color: "#00D4FF" },
        { greek: "Execution", importance: 2, note: "Wide LEAPS spreads require patience on entry/exit", color: "#FFB800" },
      ];

  return (
    <div className="strike-map-wrap">
      <div className="strike-map-title">
        <span>GREEK PRIORITY — {mode} MODE</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text3)" }}>1 = low, 5 = critical</span>
      </div>
      <table className="greeks-table">
        <thead>
          <tr>
            <th>GREEK</th>
            <th>IMPORTANCE</th>
            <th>WEIGHT</th>
            <th>NOTES</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.greek}>
              <td style={{ color: r.color, fontWeight: 500 }}>{r.greek}</td>
              <td>{r.importance}/5</td>
              <td className="greek-bar-cell">
                <div className="greek-bar">
                  <div className="greek-bar-fill" style={{ width: `${r.importance * 20}%`, background: r.color }} />
                </div>
              </td>
              <td style={{ color: "var(--text2)", fontSize: "10px" }}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── RECOMMENDATION CARDS ─────────────────────────────────────────────────────
function RecCards({ spot, ivPct, ivRank, mode, intradayCondition, leapsYears, leasPremium, leapsStrike }) {
  const daily = calcDailyEM(spot, ivPct);
  const monthly = calcMonthlyEM(spot, ivPct);
  const leapsEM = calcLEAPSEM(spot, ivPct, leapsYears || 1.5);
  const isHighIV = ivRank > 60;
  const isLowIV = ivRank < 30;

  const leapsRecs = [
    {
      type: "Stock Replacement",
      color: "var(--green)",
      delta: "0.70 – 0.85",
      strike: `$${(spot * 0.85).toFixed(0)} – $${(spot * 0.92).toFixed(0)} call`,
      structure: isHighIV ? "Call debit spread (reduce vega)" : "Deep ITM call outright",
      ivNote: isHighIV ? "High IV → Spread to reduce premium" : "Low/Mod IV → Outright ITM call",
      breakeven: leapsStrike ? `$${(parseFloat(leapsStrike) + parseFloat(leasPremium || 0)).toFixed(2)}` : "Strike + Premium",
    },
    {
      type: "Levered Directional",
      color: "var(--accent)",
      delta: "0.55 – 0.70",
      strike: `$${(spot * 0.92).toFixed(0)} – $${(spot * 0.97).toFixed(0)} call`,
      structure: isHighIV ? "Debit spread long leg" : "ITM or ATM call",
      ivNote: isHighIV ? "Sell overpriced upside to fund" : "Efficient long premium entry",
      breakeven: "Strike + Net Debit",
    },
    {
      type: "Convex Upside",
      color: "var(--yellow)",
      delta: "0.35 – 0.55",
      strike: `$${(spot * 0.97).toFixed(0)} – $${(spot * 1.02).toFixed(0)} call`,
      structure: isLowIV ? "ATM/slightly OTM call" : "Call debit spread only",
      ivNote: isLowIV ? "Low IV justifies convex exposure" : "High IV: spread only",
      breakeven: "Needs strong catalyst",
    },
    {
      type: "Speculative / PMCC",
      color: "var(--purple)",
      delta: "0.15 – 0.35",
      strike: `$${(spot * 1.05).toFixed(0)}+ call`,
      structure: isHighIV ? "PMCC: long deep ITM, sell OTM" : "Small OTM call (lotto sizing)",
      ivNote: isHighIV ? "PMCC monetizes rich front month" : "Only if strong asymmetric thesis",
      breakeven: "Far OTM — needs large move",
    },
  ];

  const condition = intradayCondition || "Range Day";
  const isTrend = condition.toLowerCase().includes("trend");
  const isRange = condition.toLowerCase().includes("range");
  const isEvent = condition.toLowerCase().includes("event");

  const zdte = [
    {
      type: "Long Premium",
      color: isTrend ? "var(--green)" : "var(--text2)",
      delta: "ATM to +0.5 EM OTM",
      strike: `$${(spot - 0.25 * daily).toFixed(1)} – $${(spot + 0.25 * daily).toFixed(1)}`,
      structure: isTrend ? "ATM call/put (momentum confirmation)" : "Only if range break confirmed",
      ivNote: isTrend ? "Realized vol expanding > implied" : "Range day: avoid long premium",
      breakeven: `Move > $${daily.toFixed(2)} (1 EM)`,
    },
    {
      type: "Debit Spread",
      color: "var(--accent)",
      delta: "Long ATM / Short 1 EM",
      strike: `Long $${spot.toFixed(1)} / Short $${(spot + daily).toFixed(1)}`,
      structure: "Defined cost + defined target zone",
      ivNote: "Cap upside, reduce theta burden",
      breakeven: "Long strike + net debit paid",
    },
    {
      type: "Short Premium",
      color: isRange ? "var(--green)" : "var(--yellow)",
      delta: "Short beyond 1.0 EM",
      strike: `Short at $${(spot - daily).toFixed(1)} / $${(spot + daily).toFixed(1)}`,
      structure: isHighIV ? "Iron condor — defined risk only" : "Credit spread at key level",
      ivNote: isHighIV ? "High IV rank: premium selling edge" : "Mod IV: only at strong levels",
      breakeven: "Profit if range holds",
    },
    {
      type: isEvent ? "Straddle / Strangle" : "Iron Condor",
      color: isEvent ? "var(--purple)" : "var(--yellow)",
      delta: isEvent ? "ATM for max gamma" : "Beyond 1.5 EM",
      strike: isEvent ? `ATM $${spot.toFixed(1)}` : `Wings at $${(spot - 1.5 * daily).toFixed(1)} / $${(spot + 1.5 * daily).toFixed(1)}`,
      structure: isEvent ? "Long straddle if IV underpricing move" : "Collect premium on both sides",
      ivNote: isEvent ? "Only if expected move > priced move" : "High IV + low realized vol",
      breakeven: isEvent ? "Move must beat ATM straddle" : "Max profit if range holds",
    },
  ];

  const recs = mode === "LEAPS" ? leapsRecs : mode === "0DTE" ? zdte : [...leapsRecs.slice(0, 2), ...zdte.slice(0, 2)];

  return (
    <div className="rec-grid">
      {recs.map((r, i) => (
        <div key={i} className="rec-card">
          <div className="rec-card-head">
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
            <div className="rec-card-type" style={{ color: r.color }}>{r.type}</div>
          </div>
          <div className="rec-card-body">
            {[
              ["DELTA TARGET", r.delta],
              ["STRIKE ZONE", r.strike],
              ["STRUCTURE", r.structure],
              ["IV CONTEXT", r.ivNote],
              ["BREAKEVEN", r.breakeven],
            ].map(([k, v]) => (
              <div key={k} className="rec-row">
                <div className="rec-row-label">{k}</div>
                <div className="rec-row-val">{v}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CHECKLIST ────────────────────────────────────────────────────────────────
function Checklist({ mode, ivPct, ivRank, spot, leapsStrike, leasPremium, leapsYears }) {
  const items = mode === "LEAPS"
    ? [
        { ok: ivRank < 50, text: <><strong>IV Rank is {ivRank}%</strong> — {ivRank < 30 ? "✓ Low: outright long call is efficient" : ivRank < 50 ? "Moderate: consider debit spread" : "⚠ High: debit spread or diagonal preferred over outright"}</> },
        { ok: true, text: <><strong>Annual extrinsic burden:</strong> {leapsStrike && leasPremium ? `$${calcExtrinsicBurden(spot, parseFloat(leapsStrike), parseFloat(leasPremium), leapsYears || 1.5).annualBurden.toFixed(2)}/yr (${calcExtrinsicBurden(spot, parseFloat(leapsStrike), parseFloat(leasPremium), leapsYears || 1.5).pct.toFixed(1)}% of stock price)` : "Enter strike and premium to calculate"}</> },
        { ok: true, text: <><strong>Breakeven check:</strong> {leapsStrike && leasPremium ? `$${(parseFloat(leapsStrike) + parseFloat(leasPremium)).toFixed(2)} — ensure your price target exceeds this` : "Enter strike and premium to calculate breakeven"}</> },
        { ok: true, text: <><strong>Thesis timeframe:</strong> Ensure catalyst and expected price path fit the LEAPS expiration window</> },
        { ok: ivRank < 50, text: <><strong>IV structure:</strong> {ivRank < 50 ? "Favorable for outright long vega exposure" : "Consider poor man's covered call (PMCC) diagonal to monetize rich front-month IV"}</> },
      ]
    : [
        { ok: true, text: <><strong>Same-day implied move:</strong> ${calcDailyEM(spot, ivPct).toFixed(2)} — check ATM straddle on your broker chain to confirm</> },
        { ok: true, text: <><strong>VWAP context:</strong> Directional trades need price above VWAP (calls) or below VWAP (puts) — not just thesis-based</> },
        { ok: true, text: <><strong>Range check:</strong> If current intraday range is already 70%+ of the daily EM, avoid chasing long premium unless volume expands</> },
        { ok: ivRank > 40, text: <><strong>IV rank ({ivRank}%):</strong> {ivRank > 50 ? "High IV — short premium / iron condor has edge" : "Moderate IV — long premium viable if direction confirmed"}</> },
        { ok: true, text: <><strong>Hard exit rule:</strong> Define profit target, invalidation level, AND time stop before entering — never hold to expiry on losers</> },
        { ok: true, text: <><strong>Contract liquidity:</strong> Verify tight bid-ask spread and high open interest — use limit orders only</> },
      ];

  return (
    <div className="checklist">
      {items.map((item, i) => (
        <div key={i} className="check-item">
          <div className="check-icon">{item.ok ? "✓" : "⚠"}</div>
          <div className="check-text" style={{ color: item.ok ? "var(--text2)" : "var(--yellow)" }}>{item.text}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function IVStrikeSelector() {
  const [ticker, setTicker] = useState("");
  const [spot, setSpot] = useState("");
  const [ivPct, setIvPct] = useState("");
  const [ivLow, setIvLow] = useState("");
  const [ivHigh, setIvHigh] = useState("");
  const [mode, setMode] = useState("BOTH");
  const [intradayCondition, setIntradayCondition] = useState("Range Day");
  const [leapsYears, setLeapsYears] = useState("1.5");
  const [leapsStrike, setLeapsStrike] = useState("");
  const [leasPremium, setLeapsPremium] = useState("");

  const [fetching, setFetching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [result, setResult] = useState(null);
  const [aiText, setAiText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef(null);

  // ── FETCH LIVE DATA (Yahoo Finance via Allorigins proxy) ──────────────────
  const fetchLiveData = useCallback(async () => {
    if (!ticker.trim()) return;
    setFetching(true);
    setFetchErr("");
    try {
      const sym = ticker.trim().toUpperCase();
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
      const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxy);
      const json = await res.json();
      const data = JSON.parse(json.contents);
      const q = data?.chart?.result?.[0];
      if (!q) throw new Error("No data returned");
      const meta = q.meta;
      const price = meta.regularMarketPrice || meta.previousClose;
      setSpot(price.toFixed(2));

      // Approximate IV from VIX-like method (use historical range as proxy)
      const high = meta.fiftyTwoWeekHigh || price * 1.3;
      const low = meta.fiftyTwoWeekLow || price * 0.7;
      const roughIV = Math.round(((high - low) / price) * 80);
      setIvPct(roughIV.toString());
      setIvLow(Math.max(10, roughIV - 20).toString());
      setIvHigh(Math.min(120, roughIV + 30).toString());
    } catch (e) {
      setFetchErr(`Could not fetch ${ticker.toUpperCase()}. Enter values manually below.`);
    } finally {
      setFetching(false);
    }
  }, [ticker]);

  // ── ANALYZE WITH CLAUDE API ───────────────────────────────────────────────
  const analyze = useCallback(async () => {
    if (!spot || !ivPct) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setAnalyzing(true);
    setAiText("");
    setStreaming(true);

    const ivRank = ivLow && ivHigh ? calcIVRank(parseFloat(ivPct), parseFloat(ivLow), parseFloat(ivHigh)) : 50;
    const daily = calcDailyEM(parseFloat(spot), parseFloat(ivPct));
    const monthly = calcMonthlyEM(parseFloat(spot), parseFloat(ivPct));
    const leapsEMVal = calcLEAPSEM(parseFloat(spot), parseFloat(ivPct), parseFloat(leapsYears) || 1.5);
    const extrinsic = leapsStrike && leasPremium
      ? calcExtrinsicBurden(parseFloat(spot), parseFloat(leapsStrike), parseFloat(leasPremium), parseFloat(leapsYears) || 1.5)
      : null;

    const systemPrompt = `You are an expert options strategist embedded in the Profit Pathfinder trading platform. 
You apply a rigorous IV-based strike selection framework from a research report focused on LEAPS and 0DTE options.

CORE PRINCIPLES from the framework:
- IV should be used as a probability-distribution input, NOT a directional signal
- Convert IV → expected move first, then evaluate strike distance in EM units
- LEAPS: dominated by delta and vega. Best structure: 0.70-0.85 delta deep ITM for stock replacement
- 0DTE: dominated by gamma, theta, execution. Long premium only when realized move can beat implied move
- IV Rank contextualizes whether premiums are cheap or expensive relative to the past year
- The bubble pops not when P/E ratios are high but when the 'E' stops growing — same logic applies to IV: the edge disappears when realized vol meets implied vol

ANALYSIS RULES:
- Always cite expected move math in your response (daily EM, etc.)
- Reference delta zones by number (0.70-0.85, etc.)
- Give a PRIMARY recommendation and a SECONDARY alternative
- Flag any risk clearly with specific numbers
- Be direct and concise — this is a trading tool, not a tutorial
- Format with bold for key terms, never use bullet lists longer than 5 items
- Keep total response under 350 words`;

    const userPrompt = `Analyze this options setup for ${ticker || "the stock"} and provide strike selection guidance:

MARKET DATA:
- Ticker: ${ticker || "UNKNOWN"}
- Spot Price: $${spot}
- Implied Volatility (IV%): ${ivPct}%
- IV Rank: ${ivRank}% (${ivRank < 30 ? "LOW" : ivRank < 60 ? "MODERATE" : "HIGH"})
- 52W IV Range: ${ivLow || "N/A"} – ${ivHigh || "N/A"}%

EXPECTED MOVE MATH:
- Daily EM (0DTE): $${daily.toFixed(2)} → Range: $${(parseFloat(spot)-daily).toFixed(2)} – $${(parseFloat(spot)+daily).toFixed(2)}
- Monthly EM (30D): $${monthly.toFixed(2)}
- LEAPS EM (${leapsYears}yr): $${leapsEMVal.toFixed(2)}

MODE REQUESTED: ${mode}
${mode === "0DTE" || mode === "BOTH" ? `Intraday Condition: ${intradayCondition}` : ""}
${mode === "LEAPS" || mode === "BOTH" ? `LEAPS Duration: ${leapsYears} years` : ""}
${leapsStrike ? `LEAPS Strike Input: $${leapsStrike}` : ""}
${leasPremium ? `LEAPS Premium Input: $${leasPremium}` : ""}
${extrinsic ? `Extrinsic Burden: $${extrinsic.extrinsic.toFixed(2)} total | $${extrinsic.annualBurden.toFixed(2)}/yr (${extrinsic.pct.toFixed(1)}% of stock)` : ""}

Provide:
1. PRIMARY strike recommendation with exact strike, delta target, and structure
2. IV regime assessment and what it means for this specific setup  
3. Key risk — one specific number the trader must watch
4. If LEAPS: breakeven check and extrinsic burden verdict
5. If 0DTE: whether long or short premium has edge given the intraday condition`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          stream: true,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "content_block_delta" && data.delta?.text) {
                accumulated += data.delta.text;
                setAiText(accumulated);
              }
            } catch {}
          }
        }
      }

      setResult({ spot: parseFloat(spot), ivPct: parseFloat(ivPct), ivRank, daily, monthly, leapsEMVal, mode, intradayCondition });
    } catch (e) {
      if (e.name !== "AbortError") {
        setAiText("Analysis failed. Please check your connection and try again.");
      }
    } finally {
      setAnalyzing(false);
      setStreaming(false);
    }
  }, [spot, ivPct, ivLow, ivHigh, mode, intradayCondition, leapsYears, leapsStrike, leasPremium, ticker]);

  const ivRank = ivLow && ivHigh ? calcIVRank(parseFloat(ivPct) || 0, parseFloat(ivLow), parseFloat(ivHigh)) : 50;
  const rankColor = ivRank < 30 ? "var(--green)" : ivRank < 60 ? "var(--yellow)" : "var(--red)";
  const ivRegimeLabel = parseFloat(ivPct) < 25 ? "LOW" : parseFloat(ivPct) < 40 ? "MODERATE" : parseFloat(ivPct) < 60 ? "HIGH" : "EXTREME";

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="root">
        {/* HEADER */}
        <div className="header">
          <div className="header-brand">
            <div className="brand-dot" />
            <div>
              <div className="brand-label">PROFIT PATHFINDER</div>
              <div className="brand-title">IV Strike <span>Selector</span></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="header-badge">LEAPS + 0DTE ENGINE</div>
            <div className="header-badge" style={{ color: "var(--green)", borderColor: "rgba(0,229,160,0.2)", background: "rgba(0,229,160,0.06)" }}>
              AI POWERED
            </div>
          </div>
        </div>

        <div className="layout">
          {/* LEFT PANEL */}
          <div className="left-panel">
            {/* TICKER */}
            <div className="panel-section">
              <div className="panel-section-title">Market Data</div>
              <div className="field">
                <label>TICKER SYMBOL</label>
                <input
                  value={ticker}
                  onChange={e => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g. NVDA, SPY, AAPL"
                  onKeyDown={e => e.key === "Enter" && fetchLiveData()}
                />
              </div>
              <button className="fetch-btn" onClick={fetchLiveData} disabled={!ticker || fetching}>
                {fetching ? <span className="loading-ring" /> : "⟳"}
                {fetching ? "FETCHING..." : "FETCH LIVE PRICE + IV ESTIMATE"}
              </button>
              {fetchErr && <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--yellow)" }}>{fetchErr}</div>}
              <div className="api-notice">
                ⚡ Live price via Yahoo Finance. IV is estimated from 52W range. For precise IV, enter manually below from your broker's options chain.
              </div>
            </div>

            {/* PRICE + IV */}
            <div className="panel-section">
              <div className="panel-section-title">Manual Override</div>
              <div className="field-row">
                <div className="field">
                  <label>SPOT PRICE ($)</label>
                  <input type="number" value={spot} onChange={e => setSpot(e.target.value)} placeholder="e.g. 130.00" />
                </div>
                <div className="field">
                  <label>IV % (ANNUAL)</label>
                  <input type="number" value={ivPct} onChange={e => setIvPct(e.target.value)} placeholder="e.g. 45" />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>52W IV LOW %</label>
                  <input type="number" value={ivLow} onChange={e => setIvLow(e.target.value)} placeholder="e.g. 20" />
                </div>
                <div className="field">
                  <label>52W IV HIGH %</label>
                  <input type="number" value={ivHigh} onChange={e => setIvHigh(e.target.value)} placeholder="e.g. 80" />
                </div>
              </div>

              {/* IV Rank indicator */}
              {ivLow && ivHigh && ivPct && (
                <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className="panel-section-title" style={{ padding: 0, border: 0, marginBottom: 0 }}>IV RANK</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: rankColor, fontWeight: 600 }}>{ivRank}% — {ivRegimeLabel}</span>
                  </div>
                  <div className="iv-rank-bar">
                    <div className="iv-rank-fill" style={{ width: `${ivRank}%`, background: rankColor }} />
                  </div>
                </div>
              )}
            </div>

            {/* MODE */}
            <div className="panel-section">
              <div className="panel-section-title">Mode Selection</div>
              <div className="mode-tabs">
                {MODES.map(m => (
                  <div key={m} className={`mode-tab ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}>{m}</div>
                ))}
              </div>
            </div>

            {/* 0DTE OPTIONS */}
            {(mode === "0DTE" || mode === "BOTH") && (
              <div className="panel-section">
                <div className="panel-section-title">0DTE Parameters</div>
                <div className="field">
                  <label>INTRADAY CONDITION</label>
                  <select value={intradayCondition} onChange={e => setIntradayCondition(e.target.value)}>
                    {INTRADAY_CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* LEAPS OPTIONS */}
            {(mode === "LEAPS" || mode === "BOTH") && (
              <div className="panel-section">
                <div className="panel-section-title">LEAPS Parameters</div>
                <div className="field">
                  <label>YEARS TO EXPIRATION</label>
                  <input type="number" step="0.25" value={leapsYears} onChange={e => setLeapsYears(e.target.value)} placeholder="e.g. 1.5" />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>STRIKE ($)</label>
                    <input type="number" value={leapsStrike} onChange={e => setLeapsStrike(e.target.value)} placeholder="e.g. 110" />
                  </div>
                  <div className="field">
                    <label>PREMIUM ($)</label>
                    <input type="number" value={leasPremium} onChange={e => setLeapsPremium(e.target.value)} placeholder="e.g. 28" />
                  </div>
                </div>
                {leapsStrike && leasPremium && spot && (
                  <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
                    {(() => {
                      const e = calcExtrinsicBurden(parseFloat(spot), parseFloat(leapsStrike), parseFloat(leasPremium), parseFloat(leapsYears) || 1.5);
                      const be = parseFloat(leapsStrike) + parseFloat(leasPremium);
                      return (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text3)" }}>BREAKEVEN</span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)" }}>${be.toFixed(2)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text3)" }}>EXTRINSIC</span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text)" }}>${e.extrinsic.toFixed(2)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text3)" }}>ANNUAL BURDEN</span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: e.pct > 8 ? "var(--red)" : e.pct > 5 ? "var(--yellow)" : "var(--green)" }}>
                              ${e.annualBurden.toFixed(2)}/yr ({e.pct.toFixed(1)}%)
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ANALYZE */}
            <button className="analyze-btn" onClick={analyze} disabled={!spot || !ivPct || analyzing}>
              {analyzing ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="loading-ring" /> ANALYZING...
                </span>
              ) : "⚡ GENERATE STRIKE ANALYSIS"}
            </button>
            <div className="disclaimer">
              Not financial advice. Options involve risk of loss. Educational tool only.
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="right-panel">
            {!result && !aiText && !analyzing && (
              <div className="empty-state">
                <div className="empty-icon">◎</div>
                <div className="empty-title">IV Strike Selector</div>
                <div className="empty-sub">
                  Enter a ticker and click Fetch, or manually<br />
                  enter spot price and IV%. Select your mode<br />
                  (LEAPS / 0DTE / Both) and click Analyze.<br /><br />
                  The engine applies expected move math from<br />
                  the IV research framework to recommend<br />
                  optimal strikes, deltas, and structures.
                </div>
              </div>
            )}

            {/* LIVE ANALYSIS STATE */}
            {(result || aiText || analyzing) && spot && ivPct && (
              <>
                {/* TICKER HERO */}
                <div className="ticker-hero">
                  <div>
                    <div className="ticker-name">{ticker || "STOCK"}</div>
                    <div className="ticker-price">${parseFloat(spot).toFixed(2)}</div>
                    <div className="ticker-meta">Spot Price · {new Date().toLocaleDateString()}</div>
                  </div>
                  <div className="ticker-stats">
                    <div className="ticker-stat">
                      <div className="ticker-stat-label">IV %</div>
                      <div className="ticker-stat-val" style={{ color: "var(--yellow)" }}>{ivPct}%</div>
                    </div>
                    <div className="ticker-stat">
                      <div className="ticker-stat-label">IV RANK</div>
                      <div className="ticker-stat-val" style={{ color: rankColor }}>{ivRank}%</div>
                    </div>
                    <div className="ticker-stat">
                      <div className="ticker-stat-label">REGIME</div>
                      <div className="ticker-stat-val" style={{ color: rankColor }}>{ivRegimeLabel}</div>
                    </div>
                    <div className="ticker-stat">
                      <div className="ticker-stat-label">MODE</div>
                      <div className="ticker-stat-val" style={{ color: "var(--accent)" }}>{mode}</div>
                    </div>
                  </div>
                </div>

                {/* EXPECTED MOVE CARDS */}
                <div>
                  <div className="section-hdr">
                    <div className="section-hdr-text">EXPECTED MOVE MATH</div>
                    <div className="section-hdr-line" />
                  </div>
                  <EMCards spot={parseFloat(spot)} ivPct={parseFloat(ivPct)} leapsYears={parseFloat(leapsYears) || 1.5} />
                </div>

                {/* STRIKE MAP */}
                <StrikeMap
                  spot={parseFloat(spot)} ivPct={parseFloat(ivPct)} mode={mode}
                  dailyEM={calcDailyEM(parseFloat(spot), parseFloat(ivPct))}
                  monthlyEM={calcMonthlyEM(parseFloat(spot), parseFloat(ivPct))}
                  leapsYears={parseFloat(leapsYears) || 1.5}
                />

                {/* RECOMMENDATION CARDS */}
                <div>
                  <div className="section-hdr">
                    <div className="section-hdr-text">STRIKE RECOMMENDATIONS — {mode}</div>
                    <div className="section-hdr-line" />
                  </div>
                  <RecCards
                    spot={parseFloat(spot)} ivPct={parseFloat(ivPct)} ivRank={ivRank} mode={mode}
                    intradayCondition={intradayCondition} leapsYears={parseFloat(leapsYears) || 1.5}
                    leapsStrike={leapsStrike} leasPremium={leasPremium}
                  />
                </div>

                {/* GREEKS */}
                <GreeksTable mode={mode === "BOTH" ? "LEAPS" : mode} ivPct={parseFloat(ivPct)} />

                {/* AI ANALYSIS */}
                <div className="ai-analysis">
                  <div className="ai-analysis-head">
                    <div className="ai-dot" />
                    <div className="ai-label">CLAUDE AI — IV FRAMEWORK ANALYSIS</div>
                    {streaming && <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text3)", marginLeft: "auto" }}>STREAMING...</span>}
                  </div>
                  <div className="ai-body">
                    {aiText
                      ? <>
                          <span dangerouslySetInnerHTML={{ __html: aiText
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br/>')
                          }} />
                          {streaming && <span className="streaming-cursor" />}
                        </>
                      : <span style={{ color: "var(--text3)" }}>
                          <span className="loading-ring" /> Generating analysis...
                        </span>
                    }
                  </div>
                </div>

                {/* CHECKLIST */}
                <div>
                  <div className="section-hdr">
                    <div className="section-hdr-text">PRE-TRADE CHECKLIST</div>
                    <div className="section-hdr-line" />
                  </div>
                  <Checklist
                    mode={mode === "BOTH" ? "LEAPS" : mode} ivPct={parseFloat(ivPct)} ivRank={ivRank}
                    spot={parseFloat(spot)} leapsStrike={leapsStrike} leasPremium={leasPremium}
                    leapsYears={parseFloat(leapsYears) || 1.5}
                  />
                </div>

                <div className="disclaimer">
                  PROFIT PATHFINDER · IV STRIKE SELECTOR · NOT FINANCIAL ADVICE · OPTIONS INVOLVE RISK OF LOSS
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
