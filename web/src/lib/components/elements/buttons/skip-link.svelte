<script lang="ts">
  import { t } from 'svelte-i18n';
  import Button from './button.svelte';

  interface Props {
    /**
     * Target for the skip link to move focus to.
     */
    target?: string;
    text?: string;
  }

  let { target = 'main', text = $t('skip_to_content') }: Props = $props();

  let isFocused = $state(false);

  const moveFocus = () => {
    const targetEl = document.querySelector<HTMLElement>(target);
    targetEl?.focus();
  };
</script>

<div class="absolute z-50 top-2 left-2 transition-transform {isFocused ? 'translate-y-0' : '-translate-y-10 sr-only'}">
  <Button
    size={'sm'}
    rounded="none"
    onclick={moveFocus}
    onfocus={() => (isFocused = true)}
    onblur={() => (isFocused = false)}
  >
    {text}
  </Button>
</div>
