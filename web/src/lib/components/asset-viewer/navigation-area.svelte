<script lang="ts">
  export let onClick: (e: MouseEvent) => void;
  export let label: string;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="my-auto group hover:cursor-pointer" on:click={onClick}>
  <button
    class="mx-4 rounded-full p-3 text-gray-500 transition group-hover:bg-gray-500 group-hover:text-white"
    aria-label={label}
  >
    <slot />
  </button>
</div>
