/**
 * Ambient gradient orbs background — IgniteFIRE signature look.
 * Renders fixed, behind all content (z-0). Pages should sit on z-10+.
 */
export function Orbs() {
  return (
    <div aria-hidden className="pointer-events-none">
      <div className="orb orb-indigo" style={{ width: 620, height: 620, top: -220, left: -180 }} />
      <div className="orb orb-violet" style={{ width: 460, height: 460, top: '40%', right: -160 }} />
      <div className="orb orb-green"  style={{ width: 420, height: 420, bottom: -160, left: '30%' }} />
    </div>
  );
}
