<script lang="ts">
  import type { InterpolationValues } from '$lib/components/i18n/format-message';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import type { Translations } from 'svelte-i18n';

  interface Props {
    key: Translations;
    values?: InterpolationValues;
  }

  let { key, values = {} }: Props = $props();
</script>

<FormatMessage {key} {values}>
  {#snippet children({ message, tag })}
    {#if tag === 'b'}
      <b>{message}</b>
    {/if}
  {/snippet}
</FormatMessage>
