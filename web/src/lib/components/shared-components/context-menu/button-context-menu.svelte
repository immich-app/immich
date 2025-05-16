<script lang="ts">
  import { contextMenuNavigation } from '$lib/actions/context-menu-navigation';
  import { shortcuts } from '$lib/actions/shortcut';
  import CircleIconButton, {
    type Color,
    type Padding,
  } from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import { languageManager } from '$lib/managers/language-manager.svelte';
  import { optionClickCallbackStore, selectedIdStore } from '$lib/stores/context-menu.store';
  import {
    getContextMenuPositionFromBoundingRect,
    getContextMenuPositionFromEvent,
    type Align,
  } from '$lib/utils/context-menu';
  import { generateId } from '$lib/utils/generate-id';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type Props = {
    icon: string;
    title: string;
    /**
     * The alignment of the context menu relative to the button.
     */
    align?: Align;
    /**
     * The direction in which the context menu should open.
     */
    // TODO change to start vs end
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
  } & HTMLAttributes<HTMLDivElement>;

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
    ...restProps
  }: Props = $props();

  let isOpen = $state(false);
  let contextMenuPosition = $state({ x: 0, y: 0 });
  let menuContainer: HTMLUListElement | undefined = $state();
  let buttonContainer: HTMLDivElement | undefined = $state();

  const id = generateId();
  const buttonId = `context-menu-button-${id}`;
  const menuId = `context-menu-${id}`;

  const openDropdown = (event: KeyboardEvent | MouseEvent) => {
    let layoutAlign = align;
    if (languageManager.rtl) {
      if (align.includes('left')) {
        layoutAlign = align.replace('left', 'right') as Align;
      } else if (align.includes('right')) {
        layoutAlign = align.replace('right', 'left') as Align;
      }
    }
    contextMenuPosition = getContextMenuPositionFromEvent(event, layoutAlign);
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

  const handleDocumentClick = (event: MouseEvent) => {
    if (!isOpen) {
      return;
    }

    const target = event.target as Node | null;
    if (buttonContainer?.contains(target)) {
      return;
    }

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
<svelte:document onclick={handleDocumentClick} />

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
  onresize={onResize}
  {...restProps}
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
