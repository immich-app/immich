<script lang="ts">
  import { tick } from 'svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import { shortcuts } from '$lib/actions/shortcut';
  import { generateId } from '$lib/utils/generate-id';
  import { contextMenuNavigation } from '$lib/actions/context-menu-navigation';
  import { optionClickCallbackStore, selectedIdStore } from '$lib/stores/context-menu.store';

  export let title: string;
  export let direction: 'left' | 'right' = 'right';
  export let x = 0;
  export let y = 0;
  export let isOpen = false;
  export let onClose: (() => unknown) | undefined;

  let uniqueKey = {};
  let menuContainer: HTMLUListElement;
  let triggerElement: HTMLElement | undefined = undefined;

  const id = generateId();
  const menuId = `context-menu-${id}`;

  $: {
    if (isOpen && menuContainer) {
      triggerElement = document.activeElement as HTMLElement;
      menuContainer.focus();
      $optionClickCallbackStore = closeContextMenu;
    }
  }

  const reopenContextMenu = async (event: MouseEvent) => {
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: event.x,
      clientY: event.y,
    });

    const elements = document.elementsFromPoint(event.x, event.y);

    if (elements.includes(menuContainer)) {
      // User right-clicked on the context menu itself, we keep the context
      // menu as is
      return;
    }

    closeContextMenu();
    await tick();
    uniqueKey = {};

    // Event will bubble through the DOM tree
    const sectionIndex = elements.indexOf(event.target as Element);
    elements.at(sectionIndex + 1)?.dispatchEvent(contextMenuEvent);
  };

  const closeContextMenu = () => {
    triggerElement?.focus();
    onClose?.();
  };
</script>

{#key uniqueKey}
  {#if isOpen}
    <div
      use:contextMenuNavigation={{
        closeDropdown: closeContextMenu,
        container: menuContainer,
        isOpen,
        selectedId: $selectedIdStore,
        selectionChanged: (id) => ($selectedIdStore = id),
      }}
      use:shortcuts={[
        {
          shortcut: { key: 'Tab' },
          onShortcut: closeContextMenu,
        },
        {
          shortcut: { key: 'Tab', shift: true },
          onShortcut: closeContextMenu,
        },
      ]}
    >
      <section
        class="fixed left-0 top-0 z-10 flex h-screen w-screen"
        on:contextmenu|preventDefault={reopenContextMenu}
        role="presentation"
      >
        <ContextMenu
          {direction}
          {x}
          {y}
          ariaActiveDescendant={$selectedIdStore}
          ariaLabel={title}
          bind:menuElement={menuContainer}
          id={menuId}
          isVisible
          onClose={closeContextMenu}
        >
          <slot />
        </ContextMenu>
      </section>
    </div>
  {/if}
{/key}
