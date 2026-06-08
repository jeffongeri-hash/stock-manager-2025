// TODO: requires auth — wrap in auth check after demo period
import React from 'react';

const PremarketBrief = () => (
  <iframe
    src="/premarket-brief.html"
    title="Pre-Market Brief"
    className="w-full border-0"
    style={{ height: 'calc(100vh - 64px)' }}
    allow="clipboard-read; clipboard-write"
  />
);

export default PremarketBrief;
