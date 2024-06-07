<script lang="ts" context="module">
  import { clickOutside } from '$lib/actions/click-outside';
  import { createContext } from '$lib/utils/context';

  const { get: getMenuContext, set: setContext } = createContext<() => void>();
  export { getMenuContext };
</script>

<script lang="ts">
  import CircleIconButton, { type Color } from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import { getContextMenuPosition, type Align } from '$lib/utils/context-menu';
  import { shortcuts } from '$lib/actions/shortcut';
  import { focusOutside } from '$lib/actions/focus-outside';
  import { listNavigation } from '$lib/actions/list-navigation';
  import { generateId } from '$lib/utils/generate-id';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';

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
  export let buttonColor: Color = 'transparent';
  export let buttonSize: string | undefined = undefined;
  export let buttonPadding: string | undefined = undefined;
  /**
   * Additional classes to apply to the button.
   */
  export let buttonClass: string | undefined = undefined;
  /**
   * Whether or not to use a portal to render the context menu into the body of the DOM.
   */
  export let usePortal: boolean = false;

  let showContextMenu = false;
  let contextMenuPosition = { x: 0, y: 0 };
  let menuContainer: HTMLUListElement;
  let buttonContainer: HTMLDivElement;
  let selectedId: string | undefined = undefined;
  let id = generateId();

  $: buttonId = `context-menu-button-${id}`;
  $: menuId = `context-menu-${id}`;

  const openDropdown = (event: KeyboardEvent) => {
    contextMenuPosition = getContextMenuPosition(event, align);
    showContextMenu = true;
  };

  const handleClick = (event: MouseEvent) => {
    contextMenuPosition = getContextMenuPosition(event, align);
    showContextMenu = !showContextMenu;
  };

  const handleEnter = (event: KeyboardEvent) => {
    if (selectedId) {
      event.preventDefault();
      const node: HTMLLIElement | null = menuContainer.querySelector(`#${selectedId}`);
      node?.click();
      closeDropdown();
    }
  };

  const closeDropdown = () => {
    selectedId = undefined;
    showContextMenu = false;
  };

  setContext(() => {
    showContextMenu = false;
    const button: HTMLButtonElement | null = buttonContainer.querySelector(`#${buttonId}`);
    button?.focus();
  });
</script>

<div use:clickOutside={{ onOutclick: closeDropdown }} use:focusOutside={{ onFocusOut: closeDropdown }}>
  <div
    use:shortcuts={[
      {
        shortcut: { key: 'Enter' },
        onShortcut: handleEnter,
        preventDefault: false,
      },
    ]}
    use:listNavigation={{
      container: menuContainer,
      selectedId,
      selectedClass: '!bg-gray-200',
      openDropdown,
      closeDropdown,
      selectionChanged: (node) => (selectedId = node?.id),
    }}
    bind:this={buttonContainer}
  >
    <CircleIconButton
      {icon}
      {title}
      ariaControls={menuId}
      ariaExpanded={showContextMenu}
      ariaHasPopup={true}
      class={buttonClass}
      color={buttonColor}
      id={buttonId}
      on:click={handleClick}
      padding={buttonPadding}
      size={buttonSize}
    />
  </div>
  {#if usePortal}
    <Portal target="body">
      <ContextMenu
        {...contextMenuPosition}
        {direction}
        ariaActiveDescendant={selectedId}
        ariaLabelledBy={buttonId}
        bind:menuElement={menuContainer}
        id={menuId}
        isVisible={showContextMenu}
      >
        <slot />
      </ContextMenu>
    </Portal>
  {:else}
    <ContextMenu
      {...contextMenuPosition}
      {direction}
      ariaActiveDescendant={selectedId}
      ariaLabelledBy={buttonId}
      bind:menuElement={menuContainer}
      id={menuId}
      isVisible={showContextMenu}
    >
      <slot />
    </ContextMenu>
  {/if}
</div>
