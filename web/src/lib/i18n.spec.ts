import { langs } from '$lib/constants';
import { getClosestAvailableLocale } from '$lib/utils/i18n';
import { readFileSync, readdirSync } from 'node:fs';

describe('i18n', () => {
  describe('loaders', () => {
    const languageFiles = readdirSync('src/lib/i18n').sort();
    for (const filename of languageFiles) {
      test(`${filename} should have a loader`, async () => {
        const code = filename.replaceAll('.json', '');
        const item = langs.find((lang) => lang.weblateCode === code || lang.code === code);
        expect(item, `${filename} has no loader`).toBeDefined();
        if (!item) {
          return;
        }

        // verify it loads the right file
        const module: { default?: unknown } = await item.loader();
        const translations = JSON.stringify(module.default, null, 2).trim();
        const content = readFileSync(`src/lib/i18n/${filename}`).toString().trim();
        expect(translations === content, `${item.name} did not load ${filename}`).toEqual(true);
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
  });
});
