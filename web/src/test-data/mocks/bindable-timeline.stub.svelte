<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
    timelineManager?: unknown;
    options?: unknown;
    [key: string]: unknown;
  }

  let { children, timelineManager = $bindable(), options, ...rest }: Props = $props();
  const serializedOptions = $derived(JSON.stringify(options ?? {}));
</script>

<div
  {...rest}
  data-testid="timeline-stub"
  data-has-timeline={String(timelineManager !== undefined)}
  data-options={serializedOptions}
>
  {@render children?.()}
</div>
