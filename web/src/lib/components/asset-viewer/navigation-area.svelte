<script lang="ts">
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="group flex h-full place-items-center" on:click on:keydown>
  <button class="mx-4 rounded-full p-3 text-gray-500 transition group-hover:bg-gray-500 group-hover:text-white">
    <slot />
  </button>
</div>
