<script lang="ts">
  import CircleIconButton, { type Color } from '$lib/components/elements/buttons/circle-icon-button.svelte';
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

  export let icon: string;
  export let title: string;
  /**
   * The alignment of the context menu relative to the button.
   */
  export let align: Align = 'top-left';
  /**
   * The direction in which the context menu should open.
   */
  export let direction: 'left' | 'right' = 'right';
  export let color: Color = 'transparent';
  export let size: string | undefined = undefined;
  export let padding: string | undefined = undefined;
  /**
   * Additional classes to apply to the button.
   */
  export let buttonClass: string | undefined = undefined;

  let isOpen = false;
  let contextMenuPosition = { x: 0, y: 0 };
  let menuContainer: HTMLUListElement;
  let buttonContainer: HTMLDivElement;

  const id = generateId();
  const buttonId = `context-menu-button-${id}`;
  const menuId = `context-menu-${id}`;

  $: {
    if (isOpen) {
      $optionClickCallbackStore = handleOptionClick;
    }
  }

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
    if (!isOpen) {
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
    const button: HTMLButtonElement | null = buttonContainer.querySelector(`#${buttonId}`);
    button?.focus();
  };
</script>

<svelte:window on:resize={onResize} />
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
  on:resize={onResize}
>
  <div bind:this={buttonContainer}>
    <CircleIconButton
      {color}
      {icon}
      {padding}
      {size}
      {title}
      ariaControls={menuId}
      ariaExpanded={isOpen}
      ariaHasPopup={true}
      class={buttonClass}
      id={buttonId}
      on:click={handleClick}
    />
  </div>
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
      <slot />
    </ContextMenu>
  </div>
</div>
