// Jeff: add your real affiliate URL to a partner's url, then set enabled to true.
export type PartnerId = 'empower' | 'm1' | 'ibkr' | 'seekingAlpha' | 'fundrise' | 'savings';

export interface AffiliatePartner {
  name: string;
  url: string;
  blurb: string;
  enabled: boolean;
}

export const AFFILIATES: Record<PartnerId, AffiliatePartner> = {
  empower: {
    name: 'Empower Personal Dashboard',
    url: '',
    blurb: 'Free dashboard to track net worth and retirement progress.',
    enabled: false,
  },
  m1: {
    name: 'M1 Finance',
    url: '',
    blurb: 'Investing platform for building and managing a portfolio.',
    enabled: false,
  },
  ibkr: {
    name: 'Interactive Brokers',
    url: '',
    blurb: 'Brokerage platform for stocks, options, and other investments.',
    enabled: false,
  },
  seekingAlpha: {
    name: 'Seeking Alpha Premium',
    url: '',
    blurb: 'Investment research and analysis for stocks and dividends.',
    enabled: false,
  },
  fundrise: {
    name: 'Fundrise',
    url: '',
    blurb: 'Platform offering access to real estate investments.',
    enabled: false,
  },
  savings: {
    name: 'High-Yield Savings Account',
    url: '',
    blurb: 'An interest-bearing account for cash savings.',
    enabled: false,
  },
};

export const CALCULATOR_PARTNERS: Record<string, PartnerId[]> = {
  '/coast-fire-tracker': ['empower', 'm1'],
  '/coast-fire-calculator': ['empower', 'm1'],
  '/coast-fire-number': ['empower', 'm1'],
  '/what-is-coast-fire': ['empower', 'm1'],
  '/fire-for-beginners': ['empower', 'm1'],
  '/early-retirement-calculator': ['empower', 'm1'],
  '/financial-independence-calculator': ['empower', 'm1'],
  '/retirement-planning': ['empower', 'm1'],
  '/fire-guide': ['empower', 'm1'],
  '/dividend-tracker': ['ibkr', 'seekingAlpha', 'm1'],
  '/monthly-dividend-calculator': ['ibkr', 'seekingAlpha', 'm1'],
  '/covered-call-calculator': ['ibkr', 'seekingAlpha', 'm1'],
  '/zero-dte': ['ibkr', 'seekingAlpha', 'm1'],
  '/options-portfolio': ['ibkr', 'seekingAlpha', 'm1'],
  '/options-guide': ['ibkr', 'seekingAlpha', 'm1'],
  '/credit-options-guide': ['ibkr', 'seekingAlpha', 'm1'],
  '/real-estate': ['fundrise'],
  '/car-finance': ['savings'],
};

export function getPartnersForPath(path: string): AffiliatePartner[] {
  return (CALCULATOR_PARTNERS[path] ?? [])
    .map((id) => AFFILIATES[id])
    .filter((partner) => partner.enabled === true && partner.url.trim() !== '');
}