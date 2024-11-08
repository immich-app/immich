<script lang="ts">
  import type { Translations } from 'svelte-i18n';
  import FormatMessage from '../format-message.svelte';
  import type { ComponentProps } from 'svelte';

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
