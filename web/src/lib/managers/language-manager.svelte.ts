import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { lang } from '#lib/stores/preferences.store.ts';
import { convertBCP47, langs } from '#lib/utils/i18n.ts';
import { setYuccaLanguage } from '@futo-org/backups-orchestrator-ui';

class LanguageManager {
  constructor() {
    eventManager.on({
      AppInit: () => this.init(),
    });
  }

  initialized = $state(false);
  rtl = $state(false);

  init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    lang.subscribe((lang) => void this.setLanguage(lang));
  }

  async setLanguage(code: string) {
    await setYuccaLanguage(convertBCP47(code));

    const item = langs.find((item) => item.code === code);
    if (!item) {
      return;
    }

    this.rtl = item.rtl ?? false;

    document.body.setAttribute('dir', item.rtl ? 'rtl' : 'ltr');

    eventManager.emit('LanguageChange', item);
  }
}

export const languageManager = new LanguageManager();
