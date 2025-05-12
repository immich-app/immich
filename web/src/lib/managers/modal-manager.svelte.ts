import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
import { mount, unmount, type Component, type ComponentProps } from 'svelte';

type OnCloseData<T> = T extends { onClose: (data?: infer R) => void } ? R : never;
type ExtendsEmptyObject<T> = keyof T extends never ? Record<string, never> : T;

class ModalManager {
  show<T extends object>(Component: Component<T>, props: ExtendsEmptyObject<Omit<T, 'onClose'>>) {
    return this.open(Component, props).onClose;
  }

  open<T extends object, K = OnCloseData<T>>(Component: Component<T>, props: ExtendsEmptyObject<Omit<T, 'onClose'>>) {
    let modal: object = {};
    let onClose: () => Promise<void>;

    const deferred = new Promise<K | undefined>((resolve) => {
      onClose = async (data?: K) => {
        await unmount(modal);
        resolve(data);
      };

      modal = mount(Component, {
        target: document.body,
        props: {
          ...(props as T),
          onClose,
        },
      });
    });

    return {
      onClose: deferred,
      close: () => onClose(),
    };
  }

  showDialog(options: Omit<ComponentProps<typeof ConfirmDialog>, 'onClose'>) {
    return this.show(ConfirmDialog, options);
  }
}

export const modalManager = new ModalManager();
