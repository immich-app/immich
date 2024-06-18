<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { generateId } from '$lib/utils/generate-id';
  import { createEventDispatcher } from 'svelte';
  import { optionClickCallbackStore, selectedIdStore } from '$lib/stores/context-menu.store';

  export let text = '';
  export let subtitle = '';
  export let icon = '';

  let id: string = generateId();

  $: isActive = $selectedIdStore === id;

  const dispatch = createEventDispatcher<{
    click: void;
  }>();

  const handleClick = () => {
    $optionClickCallbackStore?.();
    dispatch('click');
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<li
  {id}
  on:click={handleClick}
  on:mouseover={() => ($selectedIdStore = id)}
  on:mouseleave={() => ($selectedIdStore = undefined)}
  class="w-full p-4 text-left text-sm font-medium text-immich-fg focus:outline-none focus:ring-2 focus:ring-inset dark:text-immich-dark-bg cursor-pointer border-gray-200"
  class:bg-slate-300={isActive}
  class:bg-slate-100={!isActive}
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
