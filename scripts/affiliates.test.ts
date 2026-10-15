import { afterEach, describe, expect, test } from 'bun:test';
import { AFFILIATES, CALCULATOR_PARTNERS, getPartnersForPath } from '../src/config/affiliates';

afterEach(() => {
  for (const partner of Object.values(AFFILIATES)) {
    partner.url = '';
    partner.enabled = false;
  }
});

describe('affiliate recommendations', () => {
  test('all six partners start disabled with empty URLs', () => {
    expect(Object.keys(AFFILIATES).sort()).toEqual(['empower', 'fundrise', 'ibkr', 'm1', 'savings', 'seekingAlpha']);
    for (const partner of Object.values(AFFILIATES)) {
      expect(partner.url).toBe('');
      expect(partner.enabled).toBe(false);
    }
  });

  test('disabled partners are excluded even with a URL', () => {
    AFFILIATES.empower.url = 'https://partner.test';
    expect(getPartnersForPath('/coast-fire-tracker')).toEqual([]);
  });

  test('enabled partners with empty or whitespace URLs are excluded', () => {
    AFFILIATES.empower.enabled = true;
    expect(getPartnersForPath('/coast-fire-tracker')).toEqual([]);
    AFFILIATES.empower.url = '   ';
    expect(getPartnersForPath('/coast-fire-tracker')).toEqual([]);
  });

  test('enabled partners with URLs appear only on mapped pages', () => {
    AFFILIATES.empower.enabled = true;
    AFFILIATES.empower.url = 'https://partner.test';
    expect(getPartnersForPath('/coast-fire-tracker')).toEqual([AFFILIATES.empower]);
    expect(getPartnersForPath('/car-finance')).toEqual([]);
    expect(getPartnersForPath('/unknown')).toEqual([]);
  });

  test('FIRE and early retirement pages map to Empower and M1', () => {
    for (const path of ['/coast-fire-tracker', '/coast-fire-calculator', '/coast-fire-number', '/what-is-coast-fire', '/fire-for-beginners', '/early-retirement-calculator', '/financial-independence-calculator', '/retirement-planning', '/fire-guide']) {
      expect(CALCULATOR_PARTNERS[path]).toEqual(['empower', 'm1']);
    }
  });

  test('dividend and options pages map to IBKR, Seeking Alpha and M1', () => {
    for (const path of ['/dividend-tracker', '/monthly-dividend-calculator', '/covered-call-calculator', '/zero-dte', '/options-portfolio', '/options-guide', '/credit-options-guide']) {
      expect(CALCULATOR_PARTNERS[path]).toEqual(['ibkr', 'seekingAlpha', 'm1']);
    }
  });

  test('real estate maps to Fundrise', () => {
    expect(CALCULATOR_PARTNERS['/real-estate']).toEqual(['fundrise']);
  });

  test('car finance maps to savings', () => {
    expect(CALCULATOR_PARTNERS['/car-finance']).toEqual(['savings']);
  });
});