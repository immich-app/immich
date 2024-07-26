<script lang="ts">
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import type { InterpolationValues } from '$lib/components/i18n/format-message.svelte';

  export let key: string;
  export let values: InterpolationValues = {};
</script>

<FormatMessage {key} {values} let:message let:tag>
  {#if tag === 'b'}
    <b>{message}</b>
  {/if}
</FormatMessage>
