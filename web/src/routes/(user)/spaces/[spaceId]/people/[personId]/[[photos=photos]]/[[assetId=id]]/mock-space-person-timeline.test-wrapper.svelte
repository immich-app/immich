<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    timelineManager?: Record<string, unknown>;
    options?: Record<string, unknown>;
    enableRouting?: boolean;
    spaceId?: string;
    children?: Snippet;
    empty?: Snippet;
  }

  let {
    timelineManager = $bindable(),
    options = {},
    enableRouting = false,
    spaceId,
    children,
    empty,
  }: Props = $props();
</script>

<div
  data-testid="space-person-timeline"
  data-enable-routing={String(enableRouting)}
  data-space-id={spaceId}
  data-has-timeline-manager={String(timelineManager !== undefined)}
>
  <div data-testid="timeline-options">{JSON.stringify(options)}</div>
  {@render children?.()}
  {@render empty?.()}
</div>
