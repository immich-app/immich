import ConfirmModal from '$lib/modals/ConfirmModal.svelte';
import { mount, unmount, type Component, type ComponentProps } from 'svelte';

type OnCloseData<T> = T extends { onClose: (data?: infer R) => void }
  ? R | undefined
  : T extends { onClose: (data: infer R) => void }
    ? R
    : never;
type ExtendsEmptyObject<T> = keyof T extends never ? never : T;
type StripValueIfOptional<T> = T extends undefined ? undefined : T;

// if the modal does not expect any props, makes the props param optional but also allows passing `{}` and `undefined`
type OptionalParamIfEmpty<T> = ExtendsEmptyObject<T> extends never ? [] | [Record<string, never> | undefined] : [T];

class ModalManager {
  show<T extends object>(Component: Component<T>, ...props: OptionalParamIfEmpty<Omit<T, 'onClose'>>) {
    return this.open(Component, ...props).onClose;
  }

  open<T extends object, K = OnCloseData<T>>(
    Component: Component<T>,
    ...props: OptionalParamIfEmpty<Omit<T, 'onClose'>>
  ) {
    let modal: object = {};
    let onClose: (...args: [StripValueIfOptional<K>]) => Promise<void>;

    const deferred = new Promise<StripValueIfOptional<K>>((resolve) => {
      onClose = async (...args: [StripValueIfOptional<K>]) => {
        await unmount(modal);
        resolve(args?.[0]);
      };

      modal = mount(Component, {
        target: document.body,
        props: {
          ...((props?.[0] ?? {}) as T),
          onClose,
        },
      });
    });

    return {
      onClose: deferred,
      close: (...args: [StripValueIfOptional<K>]) => onClose(args[0]),
    };
  }

  showDialog(options: Omit<ComponentProps<typeof ConfirmModal>, 'onClose'>) {
    return this.show(ConfirmModal, options);
  }
}

export const modalManager = new ModalManager();
