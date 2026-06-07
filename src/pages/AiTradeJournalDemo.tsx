// TODO: PRO PAYWALL — wrap in <PaywallRoute> after demo period
import React from 'react';

const AiTradeJournalDemo = () => (
  <iframe
    src="/ai-trade-journal-demo.html"
    title="AI Trade Journal — Live Demo"
    className="w-full border-0"
    style={{ height: 'calc(100vh - 64px)' }}
    allow="clipboard-read; clipboard-write"
  />
);

export default AiTradeJournalDemo;
