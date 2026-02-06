import { browser } from '$app/environment';
import { Theme, defaultLang } from '$lib/constants';
import { getPreferredLocale } from '$lib/utils/i18n';
import { persisted } from 'svelte-persisted-store';

export interface ThemeSetting {
  value: Theme;
  system: boolean;
}

// Locale to use for formatting dates, numbers, etc.
export const locale = persisted<string | undefined>('locale', 'default', {
  serializer: {
    parse: (text) => text || 'default',
    stringify: (object) => object ?? '',
  },
});

const preferredLocale = browser ? getPreferredLocale() : undefined;
export const lang = persisted<string>('lang', preferredLocale || defaultLang.code, {
  serializer: {
    parse: (text) => text,
    stringify: (object) => object ?? '',
  },
});

export const showDeleteModal = persisted<boolean>('delete-confirm-dialog', true, {});
