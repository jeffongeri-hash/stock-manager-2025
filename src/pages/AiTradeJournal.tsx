// TODO: PRO PAYWALL — wrap in <PaywallRoute> after demo period
import React from 'react';

const AiTradeJournal = () => (
  <iframe
    src="/ai-trade-journal.html"
    title="AI Trade Journal"
    className="w-full border-0"
    style={{ height: 'calc(100vh - 64px)' }}
    allow="clipboard-read; clipboard-write"
  />
);

export default AiTradeJournal;
