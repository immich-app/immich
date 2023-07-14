<script lang="ts">
  export let hover = false;
</script>

<button class="rounded-full p-3 transition text-gray-500 mx-4" class:navigation-button-hover={hover}>
  <slot />
</button>

<style>
  .navigation-button-hover {
    background-color: rgb(107 114 128 / var(--tw-bg-opacity));
    color: rgb(255 255 255 / var(--tw-text-opacity));
  }
</style>
