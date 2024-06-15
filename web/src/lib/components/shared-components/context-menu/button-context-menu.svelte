<script lang="ts">
  import CircleIconButton, { type Color } from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import { getContextMenuPosition, type Align } from '$lib/utils/context-menu';
  import { focusOutside } from '$lib/actions/focus-outside';
  import { generateId } from '$lib/utils/generate-id';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { contextMenuNavigation } from '$lib/actions/context-menu-navigation';
  import { optionClickCallbackStore, selectedIdStore } from '$lib/stores/context-menu.store';

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
  /**
   * Whether or not to use a portal to render the context menu into the body of the DOM.
   */
  export let usePortal: boolean = false;

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
    contextMenuPosition = getContextMenuPosition(event, align);
    isOpen = true;
  };

  const handleClick = (event: MouseEvent) => {
    contextMenuPosition = getContextMenuPosition(event, align);
    isOpen = !isOpen;
  };

  const onEscape = (event: KeyboardEvent) => {
    if (isOpen) {
      // if the dropdown is open, stop the event from propagating
      event.stopPropagation();
    }
    closeDropdown();
  };

  const onFocusOut = (event: FocusEvent) => {
    const related = event.relatedTarget as HTMLElement | null;
    if (related && menuContainer.contains(related)) {
      return;
    }
    closeDropdown();
  };

  const closeDropdown = () => {
    $selectedIdStore = undefined;
    isOpen = false;
  };

  const handleOptionClick = () => {
    closeDropdown();
    const button: HTMLButtonElement | null = buttonContainer.querySelector(`#${buttonId}`);
    button?.focus();
  };
</script>

<div use:focusOutside={{ onFocusOut }}>
  <div
    use:contextMenuNavigation={{
      container: menuContainer,
      selectedId: $selectedIdStore,
      openDropdown,
      closeDropdown,
      selectionChanged: (node) => ($selectedIdStore = node?.id),
      onEscape,
    }}
    bind:this={buttonContainer}
  >
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
  {#if usePortal}
    <Portal target="body">
      <ContextMenu
        {...contextMenuPosition}
        {direction}
        ariaActiveDescendant={$selectedIdStore}
        ariaLabelledBy={buttonId}
        bind:menuElement={menuContainer}
        id={menuId}
        isVisible={isOpen}
        onClose={closeDropdown}
      >
        <slot />
      </ContextMenu>
    </Portal>
  {:else}
    <ContextMenu
      {...contextMenuPosition}
      {direction}
      ariaActiveDescendant={$selectedIdStore}
      ariaLabelledBy={buttonId}
      bind:menuElement={menuContainer}
      id={menuId}
      isVisible={isOpen}
      onClose={closeDropdown}
    >
      <slot />
    </ContextMenu>
  {/if}
</div>
