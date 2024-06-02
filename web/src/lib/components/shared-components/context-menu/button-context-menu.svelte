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

  export let icon: string;
  export let title: string;
  export let align: Align = 'top-left';
  export let buttonColor: Color = 'transparent';

  let showContextMenu = false;
  let contextMenuPosition = { x: 0, y: 0 };
  let menuContainer: HTMLUListElement;
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

  setContext(() => (showContextMenu = false));
</script>

<div
  use:clickOutside={{ onOutclick: () => (showContextMenu = false) }}
  use:focusOutside={{ onFocusOut: () => (showContextMenu = false) }}
>
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
  >
    <CircleIconButton
      {title}
      {icon}
      color={buttonColor}
      on:click={handleClick}
      id={buttonId}
      ariaExpanded={showContextMenu}
      ariaHasPopup={true}
      ariaControls={menuId}
    />
  </div>
  <ContextMenu
    {...contextMenuPosition}
    ariaActiveDescendant={selectedId}
    ariaLabelledBy={buttonId}
    bind:menuElement={menuContainer}
    id={menuId}
    isVisible={showContextMenu}
  >
    <slot />
  </ContextMenu>
</div>
