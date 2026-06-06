import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock navigator.language before importing i18n
// Default to English for predictable tests
Object.defineProperty(globalThis.navigator, 'language', {
  value: 'en',
  writable: true,
  configurable: true,
});

// i18n module caches locale at import time, so we import dynamically
describe('i18n', () => {
  describe('t() with English locale', () => {
    let t: typeof import('../entrypoints/editor/i18n').t;

    beforeEach(async () => {
      // Re-import to pick up mocked navigator.language
      vi.resetModules();
      Object.defineProperty(globalThis.navigator, 'language', {
        value: 'en',
        configurable: true,
      });
      const mod = await import('../entrypoints/editor/i18n');
      t = mod.t;
    });

    it('returns translated string for known key', () => {
      expect(t('app.loading')).toBe('Loading...');
    });

    it('returns the key itself for unknown key', () => {
      expect(t('nonexistent.key' as any)).toBe('nonexistent.key');
    });

    it('supports interpolation with params', () => {
      const result = t('time.minutesAgo', { n: 5 });
      expect(result).toBe('5m ago');
    });

    it('supports number params', () => {
      const result = t('time.hoursAgo', { n: 3 });
      expect(result).toBe('3h ago');
    });
  });

  describe('t() with Chinese locale', () => {
    let t: typeof import('../entrypoints/editor/i18n').t;

    beforeEach(async () => {
      vi.resetModules();
      Object.defineProperty(globalThis.navigator, 'language', {
        value: 'zh-CN',
        configurable: true,
      });
      const mod = await import('../entrypoints/editor/i18n');
      t = mod.t;
    });

    it('returns Chinese string for known key', () => {
      expect(t('app.loading')).toBe('加载中...');
    });

    it('supports Chinese interpolation', () => {
      const result = t('time.minutesAgo', { n: 10 });
      expect(result).toBe('10分钟前');
    });
  });

  describe('locale detection', () => {
    it('detects zh-CN correctly', async () => {
      vi.resetModules();
      Object.defineProperty(globalThis.navigator, 'language', {
        value: 'zh-CN',
        configurable: true,
      });
      const { getCurrentLocale } = await import('../entrypoints/editor/i18n');
      expect(getCurrentLocale()).toBe('zh-CN');
    });

    it('falls back to base language (zh-TW -> zh)', async () => {
      vi.resetModules();
      Object.defineProperty(globalThis.navigator, 'language', {
        value: 'zh-TW',
        configurable: true,
      });
      const { getCurrentLocale } = await import('../entrypoints/editor/i18n');
      expect(getCurrentLocale()).toBe('zh');
    });

    it('defaults to English for unknown locale', async () => {
      vi.resetModules();
      Object.defineProperty(globalThis.navigator, 'language', {
        value: 'fr-FR',
        configurable: true,
      });
      const { getCurrentLocale } = await import('../entrypoints/editor/i18n');
      expect(getCurrentLocale()).toBe('en');
    });
  });
});
