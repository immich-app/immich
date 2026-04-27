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
    onAuxClick?: (() => void) | null;
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
    onAuxClick = null,
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

  const handleAuxClick = () => {
    if (onAuxClick) {
      onAuxClick();
    }
    if (href) {
      window.open(href, '_blank');
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
  onauxclick={handleAuxClick}
  onmouseover={() => ($selectedIdStore = id)}
  onmouseleave={() => ($selectedIdStore = undefined)}
  class="w-full p-4 relative text-start text-sm font-medium {textColor} focus:outline-none focus:ring-2 focus:ring-inset cursor-pointer border-gray-200 flex gap-2 items-center {isActive
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
    {#if href !== null}
      <a
        class="z-2 absolute w-full top-0 bottom-0 left-0"
        style:cursor="unset"
        {href}
        onclick={(evt) => evt.preventDefault()}
        onauxclick={(evt) => evt.preventDefault()}
        tabindex={-1}
        aria-label="Thumbnail URL"
      >
      </a>
    {/if}
  </div>
</li>
