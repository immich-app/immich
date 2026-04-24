<script lang="ts">
  const props = $props();
</script>

<div data-testid="noop-component" data-prop-count={String(Object.keys(props).length)}></div>
