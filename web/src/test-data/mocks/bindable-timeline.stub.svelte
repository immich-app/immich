<script lang="ts">
  interface Props {
    timelineManager?: unknown;
    options?: unknown;
    [key: string]: unknown;
  }

  let { timelineManager = $bindable(), options, ...rest }: Props = $props();
  const serializedOptions = $derived(JSON.stringify(options ?? {}));
</script>

<div
  {...rest}
  data-testid="timeline-stub"
  data-has-timeline={String(timelineManager !== undefined)}
  data-options={serializedOptions}
></div>
