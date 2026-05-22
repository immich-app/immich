import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
import { modalManager, type ActionItem } from '@immich/ui';
import { mdiKeyboard } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getKeyboardActions = ($t: MessageFormatter) => {
  const KeyboardShortcuts: ActionItem = {
    title: $t('show_keyboard_shortcuts'),
    icon: mdiKeyboard,
    onAction: () => modalManager.show(ShortcutsModal, {}),
  };

  return { KeyboardShortcuts };
};
