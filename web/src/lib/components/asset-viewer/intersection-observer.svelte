<script lang="ts">
  import { BucketPosition } from '$lib/stores/assets.store';
  import { createEventDispatcher, onMount } from 'svelte';

  export let once = false;
  export let top = '0px';
  export let bottom = '0px';
  export let left = '0px';
  export let right = '0px';
  export let root: HTMLElement | null = null;

  export let intersecting = false;
  let container: HTMLDivElement;
  const dispatch = createEventDispatcher<{
    hidden: HTMLDivElement;
    intersected: {
      container: HTMLDivElement;
      position: BucketPosition;
    };
  }>();

  onMount(() => {
    if (typeof IntersectionObserver !== 'undefined') {
      const rootMargin = `${top} ${right} ${bottom} ${left}`;

      const observer = new IntersectionObserver(
        (entries) => {
          const intersectingEntry = entries.find((entry) => entry.isIntersecting);
          intersecting = !!intersectingEntry;
          if (!intersectingEntry) {
            dispatch('hidden', container);
          }

          if (intersectingEntry && once) {
            observer.unobserve(container);
          }

          if (intersectingEntry) {
            let position: BucketPosition = BucketPosition.Visible;
            if (intersectingEntry.boundingClientRect.top + 50 > intersectingEntry.intersectionRect.bottom) {
              position = BucketPosition.Below;
            } else if (intersectingEntry.boundingClientRect.bottom < 0) {
              position = BucketPosition.Above;
            }

            dispatch('intersected', {
              container,
              position,
            });
          }
        },
        {
          rootMargin,
          root,
        },
      );

      observer.observe(container);
      return () => observer.unobserve(container);
    }
  });
</script>

<div bind:this={container}>
  <slot {intersecting} />
</div>
