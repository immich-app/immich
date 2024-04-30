<script lang="ts">
  import { tick } from 'svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';

  export let direction: 'left' | 'right' = 'right';
  export let x = 0;
  export let y = 0;
  export let isOpen = false;
  export let onClose: (() => unknown) | undefined;

  let uniqueKey = {};
  let contextMenuElement: HTMLDivElement;

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
    onClose?.();
  };
</script>

{#key uniqueKey}
  {#if isOpen}
    <section
      class="fixed left-0 top-0 z-10 flex h-screen w-screen"
      on:contextmenu|preventDefault={reopenContextMenu}
      role="presentation"
    >
      <ContextMenu
        {x}
        {y}
        {direction}
        on:outclick={closeContextMenu}
        on:escape={closeContextMenu}
        bind:menuElement={contextMenuElement}
      >
        <slot />
      </ContextMenu>
    </section>
  {/if}
{/key}
