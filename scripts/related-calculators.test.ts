import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { calculatorTools, getRelatedCalculators } from '../src/lib/related-calculators';

describe('public related calculator destinations', () => {
  test('never links routes blocked by robots.txt', () => {
    const blocked = [...readFileSync('public/robots.txt', 'utf8').matchAll(/^Disallow:\s*(\S+)/gm)].map((match) => match[1]);
    for (const tool of calculatorTools) {
      expect(blocked.some((path) => tool.href.startsWith(path))).toBe(false);
    }
  });

  test('offers 3–5 public tools excluding the current page', () => {
    const sitemap = readFileSync('public/sitemap.xml', 'utf8');
    for (const tool of calculatorTools) {
      const links = getRelatedCalculators(tool.href);
      expect(links.length).toBeGreaterThanOrEqual(3);
      expect(links.length).toBeLessThanOrEqual(5);
      expect(links.some((link) => link.href === tool.href)).toBe(false);
      for (const link of links) expect(sitemap.includes(`https://profitpathfinder.online${link.href}</loc>`)).toBe(true);
    }
  });
});