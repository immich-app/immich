<script lang="ts">
  import Button from './button.svelte';

  /**
   * Target for the skip link to move focus to.
   */
  export let target: string = 'main';

  let isFocused = false;

  const moveFocus = () => {
    const targetEl = document.querySelector<HTMLElement>(target);
    targetEl?.focus();
  };
</script>

<div class="absolute top-2 left-2 transition-transform {isFocused ? 'translate-y-0' : '-translate-y-10 sr-only'}">
  <Button
    size={'sm'}
    rounded={false}
    on:click={moveFocus}
    on:focus={() => (isFocused = true)}
    on:blur={() => (isFocused = false)}
  >
    <slot />
  </Button>
</div>
