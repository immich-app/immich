<script lang="ts" context="module">
  import { clickOutside } from '$lib/utils/click-outside';
  import { createContext } from '$lib/utils/context';

  const { get: getMenuContext, set: setContext } = createContext<() => void>();
  export { getMenuContext };
</script>

<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import type Icon from 'svelte-material-icons/AbTesting.svelte';

  export let icon: typeof Icon;
  export let title: string;

  let showContextMenu = false;
  let contextMenuPosition = { x: 0, y: 0 };

  const handleShowMenu = ({ x }: MouseEvent) => {
    const navigationBarHeight = 75;
    contextMenuPosition = { x: x, y: navigationBarHeight };
    showContextMenu = !showContextMenu;
  };

  setContext(() => (showContextMenu = false));
</script>

<div use:clickOutside on:outclick={() => (showContextMenu = false)}>
  <CircleIconButton {title} logo={icon} on:click={handleShowMenu} />
  {#if showContextMenu}
    <ContextMenu {...contextMenuPosition}>
      <div class="flex flex-col rounded-lg">
        <slot />
      </div>
    </ContextMenu>
  {/if}
</div>
