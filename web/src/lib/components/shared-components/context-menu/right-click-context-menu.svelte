<script lang="ts">
  import { tick } from 'svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import { shortcuts } from '$lib/actions/shortcut';
  import { generateId } from '$lib/utils/generate-id';
  import { registerMenuContext } from '$lib/components/shared-components/context-menu/menu.context';
  import { selectedColor } from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { contextMenuNavigation } from '$lib/actions/context-menu-navigation';

  export let title: string;
  export let direction: 'left' | 'right' = 'right';
  export let x = 0;
  export let y = 0;
  export let isOpen = false;
  export let onClose: (() => unknown) | undefined;

  let uniqueKey = {};
  let contextMenuElement: HTMLUListElement;
  let selectedId: string | undefined = undefined;
  let triggerElement: HTMLElement | undefined = undefined;
  let buttonElement: HTMLButtonElement;

  const id = generateId();
  const buttonId = `context-menu-button-${id}`;
  const menuId = `context-menu-${id}`;

  $: {
    if (isOpen && buttonElement) {
      triggerElement = document.activeElement as HTMLElement;
      buttonElement?.focus();
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

    if (elements.includes(contextMenuElement)) {
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

  const handleEnter = (event: KeyboardEvent) => {
    if (selectedId) {
      event.preventDefault();
      const node: HTMLLIElement | null = contextMenuElement.querySelector(`#${selectedId}`);
      node?.click();
    }
  };

  registerMenuContext(closeContextMenu);
</script>

{#key uniqueKey}
  {#if isOpen}
    <button
      aria-controls={menuId}
      aria-haspopup={true}
      aria-expanded={isOpen}
      id={buttonId}
      bind:this={buttonElement}
      type="button"
      class="sr-only"
      use:shortcuts={[
        {
          shortcut: { key: 'Enter' },
          onShortcut: handleEnter,
          preventDefault: false,
        },
        {
          shortcut: { key: 'Tab' },
          onShortcut: closeContextMenu,
        },
        {
          shortcut: { key: 'Tab', shift: true },
          onShortcut: closeContextMenu,
        },
      ]}
      use:contextMenuNavigation={{
        container: contextMenuElement,
        selectedId: selectedId,
        selectedClass: `!${selectedColor}`,
        closeDropdown: closeContextMenu,
        selectionChanged: (node) => (selectedId = node?.id),
      }}
    >
      {title}
    </button>
    <section
      class="fixed left-0 top-0 z-10 flex h-screen w-screen"
      on:contextmenu|preventDefault={reopenContextMenu}
      role="presentation"
    >
      <ContextMenu
        {direction}
        {x}
        {y}
        ariaActiveDescendant={selectedId}
        ariaLabelledBy={buttonId}
        bind:menuElement={contextMenuElement}
        id={menuId}
        isVisible
        onClose={closeContextMenu}
      >
        <slot />
      </ContextMenu>
    </section>
  {/if}
{/key}
