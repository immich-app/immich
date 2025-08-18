<script lang="ts">
  import { onMount } from 'svelte';
  import type { UpdatePayload } from 'vite';

  interface Props {
    onHmr: () => void;
  }
  let { onHmr }: Props = $props();

  onMount(() => {
    const hmrSupport = () => {
      // when hmr happens, skeleton is initialized to true by default
      // normally, loading asset-grid is part of a navigation event, and the completion of
      // that event triggers a scroll-to-asset, if necessary, when then clears the skeleton.
      // this handler will run the navigation/scroll-to-asset handler when hmr is performed,
      // preventing skeleton from showing after hmr
      if (import.meta && import.meta?.hot) {
        const afterUpdate = (payload: UpdatePayload) => {
          const assetGridUpdate = payload.updates.some((update) => update.path.endsWith('base-timeline-viewer.svelte'));
          if (assetGridUpdate) {
            setTimeout(onHmr, 500);
          }
        };
        import.meta.hot?.on('vite:afterUpdate', afterUpdate);
        return () => import.meta.hot?.off('vite:afterUpdate', afterUpdate);
      }
      return () => void 0;
    };
    return hmrSupport();
  });
</script>
