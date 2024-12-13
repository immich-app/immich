type OnResizeCallback = (resizeEvent: { target: HTMLElement; width: number; height: number }) => void;

let observer: ResizeObserver;
let callbacks: WeakMap<HTMLElement, OnResizeCallback>;

/**
 * Installs a resizeObserver on the given element - when the element changes
 * size, invokes a callback function with the width/height. Intended as a
 * replacement for bind:clientWidth and bind:clientHeight in svelte4 which use
 * an iframe to measure the size of the element, which can be bad for
 * performance and memory usage. In svelte5, they adapted bind:clientHeight and
 * bind:clientWidth to use an internal resize observer.
 *
 * TODO: When svelte5 is ready, go back to bind:clientWidth and
 * bind:clientHeight.
 */
export function resizeObserver(element: HTMLElement, onResize: OnResizeCallback) {
  if (!observer) {
    callbacks = new WeakMap();
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const onResize = callbacks.get(entry.target as HTMLElement);
        if (onResize) {
          onResize({
            target: entry.target as HTMLElement,
            width: entry.borderBoxSize[0].inlineSize,
            height: entry.borderBoxSize[0].blockSize,
          });
        }
      }
    });
  }

  callbacks.set(element, onResize);
  observer.observe(element);

  return {
    destroy: () => {
      callbacks.delete(element);
      observer.unobserve(element);
    },
  };
}
