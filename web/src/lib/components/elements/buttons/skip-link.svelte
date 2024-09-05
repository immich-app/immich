<script lang="ts">
  import { t } from 'svelte-i18n';
  import Button from './button.svelte';

  /**
   * Target for the skip link to move focus to.
   */
  export let target: string = 'main';
  export let text: string = $t('skip_to_content');

  let isFocused = false;

  const moveFocus = () => {
    const targetEl = document.querySelector<HTMLElement>(target);
    targetEl?.focus();
  };
</script>

<div class="absolute z-50 top-2 left-2 transition-transform {isFocused ? 'translate-y-0' : '-translate-y-10 sr-only'}">
  <Button
    size={'sm'}
    rounded="none"
    on:click={moveFocus}
    on:focus={() => (isFocused = true)}
    on:blur={() => (isFocused = false)}
  >
    {text}
  </Button>
</div>
