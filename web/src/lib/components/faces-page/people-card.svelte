<script lang="ts">
  import { PersonResponseDto, api } from '@api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
  import MenuOption from '../shared-components/context-menu/menu-option.svelte';
  import Portal from '../shared-components/portal/portal.svelte';
  import { createEventDispatcher } from 'svelte';

  export let person: PersonResponseDto;

  type MenuItemEvent = 'change-name' | 'set-birth-date' | 'merge-faces' | 'hide-face';
  let dispatch = createEventDispatcher<{
    'change-name': void;
    'set-birth-date': void;
    'merge-faces': void;
    'hide-face': void;
  }>();

  let showVerticalDots = false;
  let showContextMenu = false;
  let contextMenuPosition = { x: 0, y: 0 };
  const showMenu = ({ x, y }: MouseEvent) => {
    contextMenuPosition = { x, y };
    showContextMenu = !showContextMenu;
  };
  const onMenuExit = () => {
    showContextMenu = false;
  };
  const onMenuClick = (event: MenuItemEvent) => {
    onMenuExit();
    dispatch(event);
  };
</script>

<div
  id="people-card"
  class="relative"
  on:mouseenter={() => (showVerticalDots = true)}
  on:mouseleave={() => (showVerticalDots = false)}
  role="group"
>
  <a href="/people/{person.id}" draggable="false">
    <div class="h-48 w-48 rounded-xl brightness-95 filter">
      <ImageThumbnail
        shadow
        url={api.getPeopleThumbnailUrl(person.id)}
        altText={person.name}
        title={person.name}
        widthStyle="100%"
      />
    </div>
    {#if person.name}
      <span
        class="text-white-shadow absolute bottom-2 left-0 w-full select-text px-1 text-center font-medium text-white"
        title={person.name}
      >
        {person.name}
      </span>
    {/if}
  </a>

  <button
    class="absolute right-2 top-2"
    on:click|stopPropagation|preventDefault={showMenu}
    class:hidden={!showVerticalDots}
    data-testid="context-button-parent"
    id={`icon-${person.id}`}
  >
    <IconButton color="transparent-primary">
      <DotsVertical size="20" class="icon-white-drop-shadow" color="white" />
    </IconButton>
  </button>
</div>

{#if showContextMenu}
  <Portal target="body">
    <ContextMenu {...contextMenuPosition} on:outclick={() => onMenuExit()}>
      <MenuOption on:click={() => onMenuClick('hide-face')} text="Hide face" />
      <MenuOption on:click={() => onMenuClick('change-name')} text="Change name" />
      <MenuOption on:click={() => onMenuClick('set-birth-date')} text="Set date of birth" />
      <MenuOption on:click={() => onMenuClick('merge-faces')} text="Merge faces" />
    </ContextMenu>
  </Portal>
{/if}
