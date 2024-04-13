<script lang="ts">
  export let title = '';
  export let hSeparator = false;
</script>

<div class="relative p-6 text-xs dark:text-immich-dark-fg">
  <div class="mb-4">
    {#if title}
      <p class="absolute uppercase group-[.closed]:opacity-0 transition-opacity duration-200">{title}</p>
    {/if}
    {#if hSeparator}
      <hr class="absolute top-8 left-4 w-10 group-[.open]:opacity-0 transition-opacity duration-200" />
    {/if}
  </div>
</div>
