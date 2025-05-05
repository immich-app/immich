import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
import { mount, unmount, type Component, type ComponentProps } from 'svelte';

type OnCloseData<T> = T extends { onClose: (data: infer R) => void } ? R : never;
type OptionalIfEmpty<T extends object> = keyof T extends never ? undefined : T;

class ModalManager {
  open<T extends object, K = OnCloseData<T>>(
    Component: Component<T>,
    props?: OptionalIfEmpty<Omit<T, 'onClose'>> | Record<string, never>,
  ): Promise<K>;
  open<T extends object, K = OnCloseData<T>>(Component: Component<T>, props: OptionalIfEmpty<Omit<T, 'onClose'>>) {
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
