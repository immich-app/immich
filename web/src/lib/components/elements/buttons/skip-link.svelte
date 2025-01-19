<script lang="ts">
  import { t } from 'svelte-i18n';
  import Button from './button.svelte';

  interface Props {
    /**
     * Target for the skip link to move focus to.
     */
    target?: string;
    /**
     * Text for the skip link button.
     */
    text?: string;
    /**
     * Breakpoint at which the skip link is visible. Defaults to always being visible.
     */
    breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  }

  let { target = 'main', text = $t('skip_to_content'), breakpoint }: Props = $props();

  let isFocused = $state(false);

  const moveFocus = () => {
    const targetEl = document.querySelector<HTMLElement>(target);
    targetEl?.focus();
  };

  const getBreakpoint = () => {
    if (!breakpoint) {
      return '';
    }
    return `hidden ${breakpoint}:block`;
  };
</script>

<div class="absolute z-50 top-2 left-2 transition-transform {isFocused ? 'translate-y-0' : '-translate-y-10 sr-only'}">
  <Button
    size="sm"
    rounded="none"
    onclick={moveFocus}
    class={getBreakpoint()}
    onfocus={() => (isFocused = true)}
    onblur={() => (isFocused = false)}
  >
    {text}
  </Button>
</div>
