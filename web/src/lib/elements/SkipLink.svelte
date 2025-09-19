<script lang="ts">
  import { getTabbable } from '$lib/utils/focus-util';
  import { Button } from '@immich/ui';
  import { t } from 'svelte-i18n';

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
    if (targetEl) {
      const element = getTabbable(targetEl)[0];
      if (element) {
        element.focus();
      }
    }
  };

  const getBreakpoint = () => {
    if (!breakpoint) {
      return '';
    }
    switch (breakpoint) {
      case 'sm': {
        return 'hidden sm:block';
      }
      case 'md': {
        return 'hidden md:block';
      }
      case 'lg': {
        return 'hidden lg:block';
      }
      case 'xl': {
        return 'hidden xl:block';
      }
      case '2xl': {
        return 'hidden 2xl:block';
      }
    }
  };
</script>

<div class="absolute top-2 start-2 transition-transform {isFocused ? 'translate-y-0' : '-translate-y-10 sr-only'}">
  <Button
    size="small"
    onclick={moveFocus}
    class={getBreakpoint()}
    onfocus={() => (isFocused = true)}
    onblur={() => (isFocused = false)}
  >
    {text}
  </Button>
</div>
