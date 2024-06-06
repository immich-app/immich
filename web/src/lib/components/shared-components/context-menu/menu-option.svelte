<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { generateId } from '$lib/utils/generate-id';
  import { getMenuContext } from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import { createEventDispatcher } from 'svelte';

  export let text = '';
  export let subtitle = '';
  export let icon = '';
  export let topBorder = false;

  let id: string = generateId();
  const closeMenu = getMenuContext();

  const dispatch = createEventDispatcher<{
    click: void;
  }>();

  const handleClick = () => {
    if (closeMenu) {
      closeMenu();
    }
    dispatch('click');
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<li
  {id}
  on:click={handleClick}
  class="w-full bg-slate-100 p-4 text-left text-sm font-medium text-immich-fg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset dark:text-immich-dark-bg cursor-pointer border-gray-200"
  class:border-t-2={topBorder}
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
</li>
