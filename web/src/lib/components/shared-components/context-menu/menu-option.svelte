<script>
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiCheck } from '@mdi/js';

  export let text = '';
  export let subtitle = '';
  export let checked = false;
</script>

<button
  on:click
  class="w-full bg-slate-100 p-4 text-left text-sm font-medium text-immich-fg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset dark:text-immich-dark-bg"
  role="menuitem"
>
  {#if text}
    <div class="flex">
      <div class="w-full">
        {text}
      </div>
      {#if checked}
        <div>
          <Icon path={mdiCheck} />
        </div>
      {/if}
    </div>
  {:else}
    <slot />
  {/if}

  <slot name="subtitle">
    <p class="text-xs text-gray-500">
      {subtitle}
    </p>
  </slot>
</button>
