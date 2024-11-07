<script lang="ts">
  interface Props {
    class?: string;
    itemCount?: number;
    children?: import('svelte').Snippet<[{ itemCount: number }]>;
  }

  let { class: className = '', itemCount = $bindable(1), children }: Props = $props();

  let container: HTMLElement | undefined = $state();
  let contentRect: DOMRectReadOnly | undefined = $state();

  const getGridGap = (element: Element) => {
    const style = getComputedStyle(element);

    return {
      columnGap: parsePixels(style.columnGap),
    };
  };

  const parsePixels = (style: string) => Number.parseInt(style, 10) || 0;

  const getItemCount = (container: HTMLElement, containerWidth: number) => {
    if (!container.firstElementChild) {
      return 1;
    }

    const childContentRect = container.firstElementChild.getBoundingClientRect();
    const childWidth = Math.floor(childContentRect.width || Infinity);
    const { columnGap } = getGridGap(container);

    return Math.floor((containerWidth + columnGap) / (childWidth + columnGap)) || 1;
  };

  $effect(() => {
    if (container && contentRect) {
      itemCount = getItemCount(container, contentRect.width);
    }
  });
</script>

<div class={className} bind:this={container} bind:contentRect>
  {@render children?.({ itemCount })}
</div>
