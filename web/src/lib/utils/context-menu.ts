export type Align = 'middle' | 'top-left' | 'top-right';

export const getContextMenuPosition = (event: MouseEvent, align: Align = 'middle') => {
  const { x, y, currentTarget, target } = event;
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
