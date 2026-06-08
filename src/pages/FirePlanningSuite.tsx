// TODO: requires auth — wrap in auth check after demo period
import React from 'react';

const FirePlanningSuite = () => (
  <iframe
    src="/fire-planning-suite.html"
    title="FIRE Planning Suite"
    className="w-full border-0"
    style={{ height: 'calc(100vh - 64px)' }}
    allow="clipboard-read; clipboard-write"
  />
);

export default FirePlanningSuite;
