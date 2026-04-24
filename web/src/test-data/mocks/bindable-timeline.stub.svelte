<script lang="ts">
  interface Props {
    timelineManager?: unknown;
    [key: string]: unknown;
  }

  let { timelineManager = $bindable(), ...rest }: Props = $props();
</script>

<div {...rest} data-testid="timeline-stub" data-has-timeline={String(timelineManager !== undefined)}></div>
