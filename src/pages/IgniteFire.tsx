import React from 'react';

const IgniteFire = () => {
  return (
    <iframe
      src="/ignite-fire-app.html"
      title="IgniteFIRE Suite"
      className="w-full border-0"
      style={{ height: 'calc(100vh - 64px)' }}
      allow="clipboard-read; clipboard-write"
    />
  );
};

export default IgniteFire;
