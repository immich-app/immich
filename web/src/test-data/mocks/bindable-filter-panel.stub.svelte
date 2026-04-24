<script lang="ts">
  interface Props {
    filters?: unknown;
    [key: string]: unknown;
  }

  let { filters = $bindable(), ...rest }: Props = $props();
</script>

<div {...rest} data-testid="filter-panel-stub" data-has-filters={String(filters !== undefined)}></div>
