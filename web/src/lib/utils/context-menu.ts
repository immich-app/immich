export type Align = 'middle' | 'top-left' | 'top-right';

export type ContextMenuPosition = { x: number; y: number };

export const getContextMenuPosition = (
  event: MouseEvent | KeyboardEvent,
  align: Align = 'middle',
): ContextMenuPosition => {
  const { currentTarget, target } = event;
  const x = 'x' in event ? event.x : 0;
  const y = 'y' in event ? event.y : 0;
  const box = ((currentTarget || target) as HTMLElement)?.getBoundingClientRect();
  if (box) {
    switch (align) {
      case 'middle': {
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      }
      case 'top-left': {
        return { x: box.x, y: box.y };
      }
      case 'top-right': {
        return { x: box.x + box.width, y: box.y };
      }
    }
  }

  return { x, y };
};
