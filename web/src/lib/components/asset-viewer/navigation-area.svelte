<script lang="ts">
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="group h-full flex place-items-center" on:click on:keydown>
  <button class="rounded-full p-3 transition text-gray-500 mx-4 group-hover:text-white group-hover:bg-gray-500">
    <slot />
  </button>
</div>
