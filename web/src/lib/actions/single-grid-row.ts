export type Options = {
  onChange: (itemCount: number) => void;
};

function getGridGap(element: Element) {
  const style = getComputedStyle(element);

  return {
    columnGap: parsePixels(style.columnGap),
  };
}

const parsePixels = (style: string) => Number.parseInt(style, 10) || 0;

export function singleGridRow(container: HTMLElement, { onChange }: Options) {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { firstElementChild } = entry.target;
      if (!firstElementChild) {
        onChange(1);
        continue;
      }

      const containerWidth = entry.contentRect.width;
      const childWidth = Math.floor(firstElementChild.getBoundingClientRect().width || Infinity);
      const { columnGap } = getGridGap(entry.target);

      const itemCount = Math.floor((containerWidth + columnGap) / (childWidth + columnGap));
      onChange(itemCount || 1);
    }
  });

  resizeObserver.observe(container);

  return {
    destroy() {
      resizeObserver.disconnect();
    },
  };
}
