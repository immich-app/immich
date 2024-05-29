<script lang="ts" context="module">
  import { clickOutside } from '$lib/actions/click-outside';
  import { createContext } from '$lib/utils/context';

  const { get: getMenuContext, set: setContext } = createContext<() => void>();
  export { getMenuContext };
</script>

<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import { getContextMenuPosition } from '$lib/utils/context-menu';
  import { shortcuts } from '$lib/actions/shortcut';
  import { listNavigationV2 } from '$lib/actions/list-navigation-v2';
  import { focusOutside } from '$lib/actions/focus-outside';

  export let id: string;
  export let icon: string;
  export let title: string;

  let showContextMenu = false;
  let contextMenuPosition = { x: 0, y: 0 };
  let menuContainer: HTMLUListElement;
  let activeId: string | undefined = undefined;

  $: buttonId = `context-menu-button-${id}`;
  $: menuId = `context-menu-${id}`;

  const openDropdown = (event: KeyboardEvent) => {
    contextMenuPosition = getContextMenuPosition(event, 'top-left');
    showContextMenu = true;
  };

  const handleClick = (event: MouseEvent) => {
    contextMenuPosition = getContextMenuPosition(event, 'top-left');
    showContextMenu = !showContextMenu;
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
        shortcut: { key: 'ArrowUp' },
        onShortcut: (event) => {
          openDropdown(event);
        },
      },
      {
        shortcut: { key: 'ArrowDown' },
        onShortcut: (event) => {
          openDropdown(event);
        },
      },
    ]}
    use:listNavigationV2={{
      container: menuContainer,
      activeId,
      openDropdown,
      closeDropdown: () => (showContextMenu = false),
      selectionChanged: (node) => (activeId = node?.id),
    }}
  >
    <CircleIconButton
      {title}
      {icon}
      on:click={handleClick}
      id={buttonId}
      ariaExpanded={showContextMenu}
      ariaHasPopup={true}
      ariaControls={menuId}
    />
  </div>
  <ContextMenu
    {...contextMenuPosition}
    ariaActiveDescendant={activeId}
    ariaLabelledBy={buttonId}
    bind:menuElement={menuContainer}
    id={menuId}
    isVisible={showContextMenu}
  >
    <slot />
  </ContextMenu>
</div>
