import React from 'react';

export default function DividendTracker() {
  return (
    <iframe
      src="/dividend-tracker-app.html"
      title="Dividend Tracker"
      className="w-full border-0"
      style={{ height: 'calc(100vh - 64px)' }}
      allow="clipboard-read; clipboard-write"
    />
  );
}
