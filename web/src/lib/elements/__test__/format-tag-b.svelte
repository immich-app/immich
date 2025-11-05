<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import type { ComponentProps } from 'svelte';
  import type { Translations } from 'svelte-i18n';

  interface Props {
    key: Translations;
    values: ComponentProps<typeof FormatMessage>['values'];
  }

  let { key, values }: Props = $props();
</script>

<FormatMessage {key} {values}>
  {#snippet children({ tag, message })}
    {#if tag === 'b'}
      <strong>{message}</strong>
    {/if}
  {/snippet}
</FormatMessage>
