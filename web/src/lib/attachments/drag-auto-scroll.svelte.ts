import type { Attachment } from 'svelte/attachments';

const EDGE_ZONE = 72;
const MAX_SCROLL_SPEED = 22;

const findScrollContainer = (element: HTMLElement): HTMLElement | null => {
  let node = element.parentElement;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

export function dragAutoScroll(isActive: () => boolean): Attachment {
  return (node) => {
    const element = node as HTMLElement;
    let scrollContainer: HTMLElement | null = null;
    let pointerY = -1;
    let frame: number | null = null;

    const trackPointer = (event: DragEvent) => {
      pointerY = event.clientY;
    };

    const tick = () => {
      if (scrollContainer && pointerY >= 0) {
        const { top, bottom } = scrollContainer.getBoundingClientRect();
        let delta = 0;
        if (pointerY < top + EDGE_ZONE) {
          delta = -MAX_SCROLL_SPEED * Math.min(1, (top + EDGE_ZONE - pointerY) / EDGE_ZONE);
        } else if (pointerY > bottom - EDGE_ZONE) {
          delta = MAX_SCROLL_SPEED * Math.min(1, (pointerY - (bottom - EDGE_ZONE)) / EDGE_ZONE);
        }
        if (delta !== 0) {
          scrollContainer.scrollBy(0, delta);
        }
      }
      frame = requestAnimationFrame(tick);
    };

    $effect(() => {
      if (!isActive()) {
        return;
      }

      scrollContainer = findScrollContainer(element);
      pointerY = -1;
      globalThis.addEventListener('dragover', trackPointer);
      frame = requestAnimationFrame(tick);

      return () => {
        globalThis.removeEventListener('dragover', trackPointer);
        if (frame !== null) {
          cancelAnimationFrame(frame);
          frame = null;
        }
        scrollContainer = null;
      };
    });
  };
}
