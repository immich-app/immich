<script lang="ts">
  interface Props {
    class?: string;
    children?: import('svelte').Snippet<[{ itemCount: number }]>;
  }

  let { class: className = '', children }: Props = $props();

  let container: HTMLElement | undefined = $state();
  let contentRect: DOMRectReadOnly | undefined = $state();

  const getGridGap = (element: Element) => {
    const style = getComputedStyle(element);

    return {
      columnGap: parsePixels(style.columnGap),
    };
  };

  const parsePixels = (style: string) => Number.parseInt(style, 10) || 0;

  const itemCount = $derived.by(() => {
    if (container && container.firstElementChild && contentRect) {
      const childContentRect = container.firstElementChild.getBoundingClientRect();
      const childWidth = Math.floor(childContentRect.width || Infinity);
      const { columnGap } = getGridGap(container);

      return Math.floor((contentRect.width + columnGap) / (childWidth + columnGap)) || 1;
    }
    return 1;
  });
</script>

<div class={className} bind:this={container} bind:contentRect>
  {@render children?.({ itemCount })}
</div>
