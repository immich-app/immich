<script lang="ts">
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import type { InterpolationValues } from '$lib/components/i18n/format-message.svelte';
  import type { Translations } from 'svelte-i18n';

  export let key: Translations;
  export let values: InterpolationValues = {};
</script>

<FormatMessage {key} {values} let:message let:tag>
  {#if tag === 'b'}
    <b>{message}</b>
  {/if}
</FormatMessage>
