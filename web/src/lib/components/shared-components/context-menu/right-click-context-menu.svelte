<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import { shortcuts } from '$lib/actions/shortcut';
  import { generateId } from '$lib/utils/generate-id';
  import { contextMenuNavigation } from '$lib/actions/context-menu-navigation';
  import { optionClickCallbackStore, selectedIdStore } from '$lib/stores/context-menu.store';

  interface Props {
    title: string;
    direction?: 'left' | 'right';
    x?: number;
    y?: number;
    isOpen?: boolean;
    onClose: (() => unknown) | undefined;
    children?: Snippet;
  }

  let { title, direction = 'right', x = 0, y = 0, isOpen = false, onClose, children }: Props = $props();

  let uniqueKey = $state({});
  let menuContainer: HTMLUListElement | undefined = $state();
  let triggerElement: HTMLElement | undefined = $state(undefined);

  const id = generateId();
  const menuId = `context-menu-${id}`;

  const reopenContextMenu = async (event: MouseEvent) => {
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      // eslint-disable-next-line unicorn/prefer-global-this
      view: window,
      clientX: event.x,
      clientY: event.y,
    });

    const elements = document.elementsFromPoint(event.x, event.y);

    if (menuContainer && elements.includes(menuContainer)) {
      // User end-clicked on the context menu itself, we keep the context
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
  $effect(() => {
    if (isOpen && menuContainer) {
      triggerElement = document.activeElement as HTMLElement;
      menuContainer.focus();
      $optionClickCallbackStore = closeContextMenu;
    }
  });

  const oncontextmenu = async (event: MouseEvent) => {
    event.preventDefault();
    await reopenContextMenu(event);
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
      <section class="fixed start-0 top-0 z-10 flex h-dvh w-dvw" {oncontextmenu} role="presentation">
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
          {@render children?.()}
        </ContextMenu>
      </section>
    </div>
  {/if}
{/key}
