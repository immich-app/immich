<script>
  export let text = '';
</script>

<button
  on:click
  class="bg-slate-100 hover:bg-gray-200 text-immich-fg dark:text-immich-dark-bg p-4 w-full text-left text-sm font-medium focus:outline-none focus:ring-inset focus:ring-2"
  role="menuitem"
>
  {#if text}
    {text}
  {:else}
    <slot />
  {/if}
</button>
