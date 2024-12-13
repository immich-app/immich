<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { generateId } from '$lib/utils/generate-id';
  import { optionClickCallbackStore, selectedIdStore } from '$lib/stores/context-menu.store';

  interface Props {
    text: string;
    subtitle?: string;
    icon?: string;
    activeColor?: string;
    textColor?: string;
    onClick: () => void;
  }

  let {
    text,
    subtitle = '',
    icon = '',
    activeColor = 'bg-slate-300',
    textColor = 'text-immich-fg dark:text-immich-dark-bg',
    onClick,
  }: Props = $props();

  let id: string = generateId();

  let isActive = $derived($selectedIdStore === id);

  const handleClick = () => {
    $optionClickCallbackStore?.();
    onClick();
  };
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<li
  {id}
  onclick={handleClick}
  onmouseover={() => ($selectedIdStore = id)}
  onmouseleave={() => ($selectedIdStore = undefined)}
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
