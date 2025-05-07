import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
import { mount, unmount, type Component, type ComponentProps } from 'svelte';

type OnCloseData<T> = T extends { onClose: (data: infer R) => void | Promise<void> } ? R : never;

class ModalManager {
  open<T = { onClose: (data: unknown) => void }, K = OnCloseData<T>>(
    Component: Component<{ onClose: T }>,
    props?: Record<string, never>,
  ): Promise<K>;
  open<T extends object, K = OnCloseData<T>>(Component: Component<T>, props: Omit<T, 'onClose'>): Promise<K>;
  open<T extends object, K = OnCloseData<T>>(Component: Component<T>, props?: Omit<T, 'onClose'>) {
    return new Promise<K>((resolve) => {
      let modal: object = {};

      const onClose = async (data: K) => {
        await unmount(modal);
        resolve(data);
      };

      modal = mount(Component, {
        target: document.body,
        props: {
          ...((props ?? {}) as T),
          onClose,
        },
      });
    });
  }

  openDialog(options: Omit<ComponentProps<typeof ConfirmDialog>, 'onClose'>) {
    return this.open(ConfirmDialog, options);
  }
}

export const modalManager = new ModalManager();
