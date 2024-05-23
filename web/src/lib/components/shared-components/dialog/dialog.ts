import { writable } from 'svelte/store';

export enum DialogType {
  Confirm,
  Delete,
}

export type Dialog = {
  type: DialogType;
  message: string;
  confirm: () => void;
  cancel: () => void;
};

export type DialogOptions = {
  type: DialogType;
  message: string;
};

function createDialogWrapper() {
  const dialog = writable<Dialog | undefined>();

  function show(options: DialogOptions, onConfirmed: () => void, onCanceled: () => void) {
    const newDialog: Dialog = {
      type: options.type,
      message: options.message,
      confirm: () => {
        onConfirmed();
        dialog.set(undefined);
      },
      cancel: () => {
        onCanceled();
        dialog.set(undefined);
      },
    };

    dialog.set(newDialog);
  }

  return {
    dialog,
    show,
  };
}

export const dialogController = createDialogWrapper();
