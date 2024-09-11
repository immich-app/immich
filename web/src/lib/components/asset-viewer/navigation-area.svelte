<script lang="ts">
  export let onClick: (e: MouseEvent) => void;
  export let label: string;
</script>

<button
  type="button"
  class="my-auto mx-4 rounded-full p-3 text-gray-500 transition hover:bg-gray-500 hover:text-white"
  aria-label={label}
  on:click={onClick}
>
  <slot />
</button>
