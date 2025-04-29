import { langs } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { lang } from '$lib/stores/preferences.store';

class LanguageManager {
  constructor() {
    eventManager.on('app.init', () => lang.subscribe((lang) => this.setLanguage(lang)));
  }

  rtl = $state(false);

  setLanguage(code: string) {
    const item = langs.find((item) => item.code === code);
    if (!item) {
      return;
    }

    this.rtl = item.rtl ?? false;

    document.body.setAttribute('dir', item.rtl ? 'rtl' : 'ltr');

    eventManager.emit('language.change', item);
  }
}

export const languageManager = new LanguageManager();
