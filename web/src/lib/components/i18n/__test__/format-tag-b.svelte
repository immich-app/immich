<script lang="ts">
  import type { Translations } from 'svelte-i18n';
  import FormatMessage from '../format-message.svelte';
  import type { ComponentProps } from 'svelte';

  export let key: Translations;
  export let values: ComponentProps<FormatMessage>['values'];
</script>

<FormatMessage {key} {values} let:tag let:message>
  {#if tag === 'b'}
    <strong>{message}</strong>
  {/if}
</FormatMessage>
