// TODO: requires auth — wrap in auth check after demo period
import React from 'react';

const WeeklyFundamentalScan = () => (
  <iframe
    src="/weekly-fundamental-scan.html"
    title="Weekly Fundamental Scan"
    className="w-full border-0"
    style={{ height: 'calc(100vh - 64px)' }}
    allow="clipboard-read; clipboard-write"
  />
);

export default WeeklyFundamentalScan;
