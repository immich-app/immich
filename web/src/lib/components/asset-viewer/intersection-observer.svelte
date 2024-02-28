<script lang="ts">
  import { BucketPosition } from '$lib/stores/assets.store';
  import { createEventDispatcher, onMount } from 'svelte';

  export let once = false;
  export let top = 0;
  export let bottom = 0;
  export let left = 0;
  export let right = 0;
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
      const rootMargin = `${top}px ${right}px ${bottom}px ${left}px`;
      const observer = new IntersectionObserver(
        (entries) => {
          intersecting = entries.some((entry) => entry.isIntersecting);
          if (!intersecting) {
            dispatch('hidden', container);
          }

          if (intersecting && once) {
            observer.unobserve(container);
          }

          if (intersecting) {
            let position: BucketPosition = BucketPosition.Visible;
            if (entries[0].boundingClientRect.top + 50 > entries[0].intersectionRect.bottom) {
              position = BucketPosition.Below;
            } else if (entries[0].boundingClientRect.bottom < 0) {
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

    // The following is a fallback for older browsers
    function handler() {
      const bcr = container.getBoundingClientRect();

      intersecting =
        bcr.bottom + bottom > 0 &&
        bcr.right + right > 0 &&
        bcr.top - top < window.innerHeight &&
        bcr.left - left < window.innerWidth;

      if (intersecting && once) {
        window.removeEventListener('scroll', handler);
      }
    }

    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  });
</script>

<div bind:this={container}>
  <slot {intersecting} />
</div>
