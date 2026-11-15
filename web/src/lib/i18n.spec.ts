import { getClosestAvailableLocale, langs } from '#lib/utils/i18n.ts';

describe('i18n', () => {
  describe('loaders', () => {
    const languageFiles = import.meta.glob<{ default: unknown }>('#i18n/*.json');
    for (const [path, load] of Object.entries(languageFiles).sort(([a], [b]) => a.localeCompare(b))) {
      const filename = path.split('/').pop()!;
      test(`${filename} should have a loader`, async () => {
        if (filename === 'package.json') {
          return;
        }

        const code = filename.replaceAll('.json', '');
        const item = langs.find((lang) => lang.code === code);
        expect(item, `${filename} has no loader`).toBeDefined();
        if (!item) {
          return;
        }

        const module: { default?: unknown } = await item.loader();
        const { default: content } = await load();
        expect(module.default, `${item.name} did not load ${filename}`).toEqual(content);
      });
    }
  });

  describe('getClosestAvailableLocale', () => {
    const allLocales = ['ar', 'bg', 'en', 'en-US', 'en-DE', 'zh-Hans', 'zh-Hans-HK'];

    it('returns undefined on mismatch', () => {
      expect(getClosestAvailableLocale([], allLocales)).toBeUndefined();
      expect(getClosestAvailableLocale(['invalid'], allLocales)).toBeUndefined();
    });

    it('returns the first matching locale', () => {
      expect(getClosestAvailableLocale(['invalid', 'ar', 'bg'], allLocales)).toBe('ar');
      expect(getClosestAvailableLocale(['bg'], allLocales)).toBe('bg');
      expect(getClosestAvailableLocale(['bg', 'invalid', 'ar'], allLocales)).toBe('bg');
    });

    it('returns the locale for a less specific match', () => {
      expect(getClosestAvailableLocale(['ar-AE'], allLocales)).toBe('ar-AE');
      expect(getClosestAvailableLocale(['ar-AE', 'en'], allLocales)).toBe('ar-AE');
      expect(getClosestAvailableLocale(['zh-Hans-HK', 'zh-Hans'], allLocales)).toBe('zh-Hans-HK');
    });

    it('ignores the locale for a more specific match', () => {
      expect(getClosestAvailableLocale(['zh'], allLocales)).toBeUndefined();
      expect(getClosestAvailableLocale(['de', 'zh', 'en-US'], allLocales)).toBe('en-US');
    });

    it('matches underscore-based stored locale codes against normalized locale lists', () => {
      const allLocales = ['de-CH', 'pt-BR', 'sr-Cyrl', 'zh-Hant'];
      expect(getClosestAvailableLocale(['de_CH'], allLocales)).toBe('de_CH');
      expect(getClosestAvailableLocale(['pt_BR'], allLocales)).toBe('pt_BR');
      expect(getClosestAvailableLocale(['sr_Cyrl'], allLocales)).toBe('sr_Cyrl');
      expect(getClosestAvailableLocale(['zh_Hant'], allLocales)).toBe('zh_Hant');
    });

    it('should handle language aliases', () => {
      const allLocales = ['zh-Hans', 'zh-Hant'];
      expect(getClosestAvailableLocale(['zh-CN'], allLocales)).toBe('zh-Hans');
      expect(getClosestAvailableLocale(['zh-HK'], allLocales)).toBe('zh-Hant');
      expect(getClosestAvailableLocale(['zh-MO'], allLocales)).toBe('zh-Hant');
      expect(getClosestAvailableLocale(['zh-SG'], allLocales)).toBe('zh-Hans');
      expect(getClosestAvailableLocale(['zh-TW'], allLocales)).toBe('zh-Hant');
    });
  });
});
