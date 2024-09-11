export type Align = 'middle' | 'top-left' | 'top-right';

export type ContextMenuPosition = { x: number; y: number };

export const getContextMenuPositionFromEvent = (
  event: MouseEvent | KeyboardEvent,
  align: Align = 'middle',
): ContextMenuPosition => {
  const { currentTarget, target } = event;
  const x = 'x' in event ? event.x : 0;
  const y = 'y' in event ? event.y : 0;
  const box = ((currentTarget || target) as HTMLElement)?.getBoundingClientRect();
  if (box) {
    return getContextMenuPositionFromBoundingRect(box, align);
  }

  return { x, y };
};

export const getContextMenuPositionFromBoundingRect = (rect: DOMRect, align: Align = 'middle'): ContextMenuPosition => {
  switch (align) {
    case 'middle': {
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
    case 'top-left': {
      return { x: rect.x, y: rect.y };
    }
    case 'top-right': {
      return { x: rect.x + rect.width, y: rect.y };
    }
  }
};
