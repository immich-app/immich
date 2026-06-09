<script lang="ts">
  export let title: string;
  export let value: string | number | undefined;
  export let subtitle: string | undefined = undefined;
</script>

<div
  class="rounded-3xl border border-gray-200/70 bg-subtle p-6 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray"
>
  <p class="text-sm font-medium text-gray-500 dark:text-immich-dark-fg/75">{title}</p>
  {#if value !== undefined}
    <p class="mt-3 text-3xl font-semibold text-immich-fg dark:text-immich-dark-fg">{value}</p>
  {/if}
  {#if subtitle}
    <p class="mt-1 text-sm text-gray-500 dark:text-immich-dark-fg/75">{subtitle}</p>
  {/if}
  <slot />
</div>
