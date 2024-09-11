<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { generateId } from '$lib/utils/generate-id';
  import { optionClickCallbackStore, selectedIdStore } from '$lib/stores/context-menu.store';

  export let text: string;
  export let subtitle = '';
  export let icon = '';
  export let activeColor = 'bg-slate-300';
  export let textColor = 'text-immich-fg dark:text-immich-dark-bg';
  export let onClick: () => void;

  let id: string = generateId();

  $: isActive = $selectedIdStore === id;

  const handleClick = () => {
    $optionClickCallbackStore?.();
    onClick();
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<li
  {id}
  on:click={handleClick}
  on:mouseover={() => ($selectedIdStore = id)}
  on:mouseleave={() => ($selectedIdStore = undefined)}
  class="w-full p-4 text-left text-sm font-medium {textColor} focus:outline-none focus:ring-2 focus:ring-inset cursor-pointer border-gray-200 flex gap-2 items-center {isActive
    ? activeColor
    : 'bg-slate-100'}"
  role="menuitem"
>
  {#if icon}
    <Icon path={icon} ariaHidden={true} size="18" />
  {/if}
  <div>
    {text}
    {#if subtitle}
      <p class="text-xs text-gray-500">
        {subtitle}
      </p>
    {/if}
  </div>
</li>
