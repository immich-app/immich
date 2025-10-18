<script lang="ts">
  import type { KeyCombo } from '$lib/actions/input';
  import {
    Category,
    conditionalShortcut,
    shortcut as registerShortcut,
    ShortcutVariant,
  } from '$lib/actions/shortcut.svelte';
  import { optionClickCallbackStore, selectedIdStore } from '$lib/stores/context-menu.store';
  import { generateId } from '$lib/utils/generate-id';
  import { Icon } from '@immich/ui';

  interface Props {
    text: string;
    subtitle?: string;
    icon?: string;
    activeColor?: string;
    textColor?: string;
    onClick: () => void;
    shortcut?: KeyCombo | null;
    shortcutCategory?: Category;
    variant?: ShortcutVariant;
  }

  let {
    text,
    subtitle = '',
    icon = '',
    activeColor = 'bg-slate-300',
    textColor = 'text-immich-fg dark:text-immich-dark-bg',
    onClick,
    shortcut = null,
    shortcutCategory,
    variant,
  }: Props = $props();

  let id: string = generateId();

  let isActive = $derived($selectedIdStore === id);

  const handleClick = () => {
    $optionClickCallbackStore?.();
    onClick();
  };
</script>

<svelte:document
  {@attach conditionalShortcut(
    () => !!shortcut,
    () => registerShortcut(shortcut!, { category: shortcutCategory, text, variant }, onClick),
  )}
/>

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
    <Icon {icon} aria-hidden size="18" />
  {/if}
  <div class="w-full">
    <div class="flex justify-between">
      {text}
    </div>
    {#if subtitle}
      <p class="text-xs text-gray-500">
        {subtitle}
      </p>
    {/if}
  </div>
</li>
