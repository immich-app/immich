<script>
  import Icon from '$lib/components/elements/icon.svelte';

  export let text = '';
  export let subtitle = '';
  export let icon = '';
</script>

<button
  on:click
  class="w-full bg-slate-100 p-4 text-left text-sm font-medium text-immich-fg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset dark:text-immich-dark-bg"
  role="menuitem"
>
  {#if text}
    {#if icon}
      <p class="flex gap-2">
        <Icon path={icon} ariaHidden={true} size="18" />
        {text}
      </p>
    {:else}
      {text}
    {/if}
  {:else}
    <slot />
  {/if}

  <slot name="subtitle">
    <p class="text-xs text-gray-500">
      {subtitle}
    </p>
  </slot>
</button>
