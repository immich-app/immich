let observer: ResizeObserver;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let callbacks: WeakMap<Element, (element: Element) => any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resizeObserver(element: Element, onResize: (element: Element) => any) {
  if (!observer) {
    callbacks = new WeakMap();
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const onResize = callbacks.get(entry.target);
        if (onResize) {
          onResize(entry.target);
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
