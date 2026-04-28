<script lang="ts">
  const props = $props();
</script>

<button
  type="button"
  aria-label={props['aria-label']}
  data-disabled={String(props.disabled ?? false)}
  onclick={props.onclick}
>
  {props['aria-label']}
</button>
