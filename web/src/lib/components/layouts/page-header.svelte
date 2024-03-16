<script lang="ts">
  export let title: string;
  export let description: string | undefined = undefined;
</script>

<div
  class="sticky top-0 z-[100] bg-immich-bg dark:bg-immich-dark-bg flex w-full place-items-center justify-between border-b p-4 dark:border-immich-dark-gray dark:text-immich-dark-fg"
>
  <div class="flex gap-2 items-center">
    <div class="font-medium">{title}</div>
    {#if description}
      <p class="text-sm text-gray-400 dark:text-gray-600">{description}</p>
    {/if}
  </div>
  <slot name="buttons" />
</div>
