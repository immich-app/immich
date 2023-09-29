export type PositionLocation = 'top-right' | 'top-left';

// defaults to top-left of clicked element
export const getContextMenuPosition = (event: MouseEvent, location: PositionLocation = 'top-left') => {
  const { x, y, currentTarget, target } = event;
  const box = ((currentTarget || target) as HTMLElement)?.getBoundingClientRect();
  if (box) {
    switch (location) {
      case 'top-left':
        return { x: box.x, y: box.y };
      case 'top-right':
        return { x: box.x + box.width, y: box.y };
    }
  }

  return { x, y };
};
