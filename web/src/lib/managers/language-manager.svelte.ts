import { langs } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';

class LanguageManager {
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
