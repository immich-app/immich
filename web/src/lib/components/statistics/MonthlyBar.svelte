<script lang="ts">
  export let heightPercent: number = 4;
  export let ariaLabel: string = '';
  export let href: string | undefined;
</script>

{#if href}
  <a {href} class="group block">
    <div
      class="group flex min-h-64 flex-col items-center justify-end gap-3 rounded-2xl bg-subtle px-3 py-4 transition-colors hover:bg-gray-100 dark:bg-immich-dark-gray dark:hover:bg-immich-dark-gray/80"
    >
      <div class="flex h-48 w-full items-end">
        <div
          class="w-full rounded-t-2xl bg-immich-primary shadow-sm transition-transform duration-200"
          style={`height: ${heightPercent}%`}
          aria-label={ariaLabel}
        ></div>
      </div>
      <slot />
    </div>
  </a>
{:else}
  <div
    class="group flex min-h-64 flex-col items-center justify-end gap-3 rounded-2xl bg-subtle px-3 py-4 transition-colors hover:bg-gray-100 dark:bg-immich-dark-gray dark:hover:bg-immich-dark-gray/80"
  >
    <div class="flex h-48 w-full items-end">
      <div
        class="w-full rounded-t-2xl bg-immich-primary shadow-sm transition-transform duration-200"
        style={`height: ${heightPercent}%`}
        aria-label={ariaLabel}
      ></div>
    </div>
    <slot />
  </div>
{/if}
