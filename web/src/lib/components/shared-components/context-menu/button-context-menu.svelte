<script lang="ts">
  import CircleIconButton, {
    type Color,
    type Padding,
  } from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import {
    getContextMenuPositionFromBoundingRect,
    getContextMenuPositionFromEvent,
    type Align,
  } from '$lib/utils/context-menu';
  import { generateId } from '$lib/utils/generate-id';
  import { contextMenuNavigation } from '$lib/actions/context-menu-navigation';
  import { optionClickCallbackStore, selectedIdStore } from '$lib/stores/context-menu.store';
  import { clickOutside } from '$lib/actions/click-outside';
  import { shortcuts } from '$lib/actions/shortcut';
  import type { Snippet } from 'svelte';

  interface Props {
    icon: string;
    title: string;
    /**
     * The alignment of the context menu relative to the button.
     */
    align?: Align;
    /**
     * The direction in which the context menu should open.
     */
    direction?: 'left' | 'right';
    color?: Color;
    size?: string | undefined;
    padding?: Padding | undefined;
    /**
     * Additional classes to apply to the button.
     */
    buttonClass?: string | undefined;
    hideContent?: boolean;
    children?: Snippet;
  }

  let {
    icon,
    title,
    align = 'top-left',
    direction = 'right',
    color = 'transparent',
    size = undefined,
    padding = undefined,
    buttonClass = undefined,
    hideContent = false,
    children,
  }: Props = $props();

  let isOpen = $state(false);
  let contextMenuPosition = $state({ x: 0, y: 0 });
  let menuContainer: HTMLUListElement | undefined = $state();
  let buttonContainer: HTMLDivElement | undefined = $state();

  const id = generateId();
  const buttonId = `context-menu-button-${id}`;
  const menuId = `context-menu-${id}`;

  const openDropdown = (event: KeyboardEvent | MouseEvent) => {
    contextMenuPosition = getContextMenuPositionFromEvent(event, align);
    isOpen = true;
    menuContainer?.focus();
  };

  const handleClick = (event: MouseEvent) => {
    if (isOpen) {
      closeDropdown();
      return;
    }
    openDropdown(event);
  };

  const onEscape = (event: KeyboardEvent) => {
    if (isOpen) {
      // if the dropdown is open, stop the event from propagating
      event.stopPropagation();
    }
    closeDropdown();
  };

  const onResize = () => {
    if (!isOpen || !buttonContainer) {
      return;
    }

    contextMenuPosition = getContextMenuPositionFromBoundingRect(buttonContainer.getBoundingClientRect(), align);
  };

  const closeDropdown = () => {
    if (!isOpen) {
      return;
    }
    focusButton();
    isOpen = false;
    $selectedIdStore = undefined;
  };

  const handleOptionClick = () => {
    closeDropdown();
  };

  const focusButton = () => {
    const button = buttonContainer?.querySelector(`#${buttonId}`) as HTMLButtonElement | null;
    button?.focus();
  };

  $effect(() => {
    if (isOpen) {
      $optionClickCallbackStore = handleOptionClick;
    }
  });
</script>

<svelte:window onresize={onResize} />

<div
  use:contextMenuNavigation={{
    closeDropdown,
    container: menuContainer,
    isOpen,
    onEscape,
    openDropdown,
    selectedId: $selectedIdStore,
    selectionChanged: (id) => ($selectedIdStore = id),
  }}
  use:clickOutside={{ onOutclick: closeDropdown }}
  onresize={onResize}
>
  <div bind:this={buttonContainer}>
    <CircleIconButton
      {color}
      {icon}
      {padding}
      {size}
      {title}
      aria-controls={menuId}
      aria-expanded={isOpen}
      aria-haspopup={true}
      class={buttonClass}
      id={buttonId}
      onclick={handleClick}
    />
  </div>
  {#if isOpen || !hideContent}
    <div
      use:shortcuts={[
        {
          shortcut: { key: 'Tab' },
          onShortcut: closeDropdown,
          preventDefault: false,
        },
        {
          shortcut: { key: 'Tab', shift: true },
          onShortcut: closeDropdown,
          preventDefault: false,
        },
      ]}
    >
      <ContextMenu
        {...contextMenuPosition}
        {direction}
        ariaActiveDescendant={$selectedIdStore}
        ariaLabelledBy={buttonId}
        bind:menuElement={menuContainer}
        id={menuId}
        isVisible={isOpen}
      >
        {@render children?.()}
      </ContextMenu>
    </div>
  {/if}
</div>
