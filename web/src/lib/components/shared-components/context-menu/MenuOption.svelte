<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Shortcut } from '$lib/actions/shortcut';
  import { shortcut as bindShortcut, shortcutLabel as computeShortcutLabel } from '$lib/actions/shortcut';
  import { optionClickCallbackStore, selectedIdStore } from '$lib/stores/context-menu.store';
  import { generateId } from '$lib/utils/generate-id';
  import { Icon, type IconLike } from '@immich/ui';

  interface Props {
    text: string;
    subtitle?: string;
    icon?: IconLike;
    activeColor?: string;
    textColor?: string;
    href?: string | null;
    onClick?: (() => void) | null;
    shortcut?: Shortcut | null;
    shortcutLabel?: string;
  }

  let {
    text,
    subtitle = '',
    icon,
    activeColor = 'bg-slate-300',
    textColor = 'text-immich-fg dark:text-immich-dark-bg',
    href = null,
    onClick = null,
    shortcut = null,
    shortcutLabel = '',
  }: Props = $props();

  let id: string = generateId();

  let isActive = $derived($selectedIdStore === id);

  const handleClick = async () => {
    $optionClickCallbackStore?.();
    if (onClick) {
      onClick();
    }
    if (href) {
      await goto(href);
    }
  };

  if (shortcut && !shortcutLabel) {
    shortcutLabel = computeShortcutLabel(shortcut);
  }
  const bindShortcutIfSet =
    shortcut && onClick ? (n: HTMLElement) => bindShortcut(n, { shortcut, onShortcut: onClick }) : () => {};
</script>

<svelte:document use:bindShortcutIfSet />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<li
  {id}
  onclick={handleClick}
  onmouseover={() => ($selectedIdStore = id)}
  class="relative w-full p-4 text-start text-sm font-medium {textColor} flex cursor-pointer items-center gap-2 border-gray-200 focus:ring-2 focus:outline-none focus:ring-inset {isActive
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
      {#if shortcutLabel}
        <span class="ps-4 text-gray-500">
          {shortcutLabel}
        </span>
      {/if}
    </div>
    {#if subtitle}
      <p class="text-xs text-gray-500">
        {subtitle}
      </p>
    {/if}
    {#if href !== null}
      <a
        class="absolute inset-y-0 left-0 z-2 w-full"
        style:cursor="unset"
        {href}
        onclick={(evt) => evt.preventDefault()}
        tabindex={-1}
      >
      </a>
    {/if}
  </div>
</li>
