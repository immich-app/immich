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

<div class="skip-link {isFocused ? 'focused' : 'sr-only'}">
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

<style>
  .skip-link {
    position: absolute;
    top: 5px;
    left: 5px;
    transition: transform 0.2s;
    transform: translateY(-40%);
  }

  .skip-link.focused {
    transform: translateY(0%);
  }
</style>
