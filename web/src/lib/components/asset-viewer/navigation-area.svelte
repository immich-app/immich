<script lang="ts">
  import NavigationButton from './navigation-button.svelte';

  let hover = false;
</script>

<div
  class="h-full flex place-items-center"
  on:click
  on:keydown
  on:mouseenter={() => (hover = true)}
  on:mouseleave={() => (hover = false)}
>
  <NavigationButton {hover}><slot /></NavigationButton>
</div>
