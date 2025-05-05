<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { generateId } from '$lib/utils/generate-id';
  import { optionClickCallbackStore, selectedIdStore } from '$lib/stores/context-menu.store';
  import type { Shortcut } from '$lib/actions/shortcut';
  import { shortcutLabel as computeShortcutLabel, shortcut as bindShortcut } from '$lib/actions/shortcut';

  interface Props {
    text: string;
    subtitle?: string;
    icon?: string;
    activeColor?: string;
    textColor?: string;
    onClick: () => void;
    shortcut?: Shortcut | null;
    shortcutLabel?: string;
  }

  let {
    text,
    subtitle = '',
    icon = '',
    activeColor = 'bg-slate-300',
    textColor = 'text-immich-fg dark:text-immich-dark-bg',
    onClick,
    shortcut = null,
    shortcutLabel = '',
  }: Props = $props();

  let id: string = generateId();

  let isActive = $derived($selectedIdStore === id);

  const handleClick = () => {
    $optionClickCallbackStore?.();
    onClick();
  };

  if (shortcut && !shortcutLabel) {
    shortcutLabel = computeShortcutLabel(shortcut);
  }
  const bindShortcutIfSet = shortcut
    ? (n: HTMLElement) => bindShortcut(n, { shortcut, onShortcut: onClick })
    : () => {};
</script>

<svelte:window use:bindShortcutIfSet />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<li
  {id}
  onclick={handleClick}
  onmouseover={() => ($selectedIdStore = id)}
  onmouseleave={() => ($selectedIdStore = undefined)}
  class="w-full p-4 text-start text-sm font-medium {textColor} focus:outline-none focus:ring-2 focus:ring-inset cursor-pointer border-gray-200 flex gap-2 items-center {isActive
    ? activeColor
    : 'bg-slate-100'}"
  role="menuitem"
>
  {#if icon}
    <Icon path={icon} ariaHidden={true} size="18" />
  {/if}
  <div class="w-full">
    <div class="flex justify-between">
      {text}
      {#if shortcutLabel}
        <span class="text-gray-500 ps-4">
          {shortcutLabel}
        </span>
      {/if}
    </div>
    {#if subtitle}
      <p class="text-xs text-gray-500">
        {subtitle}
      </p>
    {/if}
  </div>
</li>
