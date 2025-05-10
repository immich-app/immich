import type { Color } from '@immich/ui';
import { writable } from 'svelte/store';

type DialogActions = {
  onClose: (confirmed: boolean) => void;
};

type DialogOptions = {
  title?: string;
  prompt?: string;
  confirmText?: string;
  confirmColor?: Color;
  cancelText?: string;
  hideCancelButton?: boolean;
  disable?: boolean;
  width?: 'wide' | 'narrow' | undefined;
};

export type Dialog = DialogOptions & DialogActions;

function createDialogWrapper() {
  const dialog = writable<Dialog | undefined>();

  async function show(options: DialogOptions) {
    return new Promise<boolean>((resolve) => {
      const newDialog: Dialog = {
        ...options,
        onClose: (confirmed) => {
          dialog.set(undefined);
          resolve(confirmed);
        },
      };

      dialog.set(newDialog);
    });
  }

  return {
    dialog,
    show,
  };
}

export const dialogController = createDialogWrapper();
