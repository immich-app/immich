<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { getContextMenuPosition } from '$lib/utils/context-menu';
  import { type PersonResponseDto } from '@api';
  import { mdiDotsVertical } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
  import MenuOption from '../shared-components/context-menu/menu-option.svelte';
  import Portal from '../shared-components/portal/portal.svelte';

  export let person: PersonResponseDto;
  export let preload = false;

  type MenuItemEvent = 'change-name' | 'set-birth-date' | 'merge-people' | 'hide-person';
  let dispatch = createEventDispatcher<{
    'change-name': void;
    'set-birth-date': void;
    'merge-people': void;
    'hide-person': void;
  }>();

  let showVerticalDots = false;
  let showContextMenu = false;
  let contextMenuPosition = { x: 0, y: 0 };
  const showMenu = (event: MouseEvent) => {
    contextMenuPosition = getContextMenuPosition(event);
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
  <a href="{AppRoute.PEOPLE}/{person.id}?{QueryParameter.PREVIOUS_ROUTE}={AppRoute.PEOPLE}" draggable="false">
    <div class="w-full h-full rounded-xl brightness-95 filter">
      <ImageThumbnail
        shadow
        {preload}
        url={getPeopleThumbnailUrl(person.id)}
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
      <Icon path={mdiDotsVertical} size="20" class="icon-white-drop-shadow text-white" />
    </IconButton>
  </button>
</div>

{#if showContextMenu}
  <Portal target="body">
    <ContextMenu {...contextMenuPosition} on:outclick={() => onMenuExit()}>
      <MenuOption on:click={() => onMenuClick('hide-person')} text="Hide Person" />
      <MenuOption on:click={() => onMenuClick('change-name')} text="Change name" />
      <MenuOption on:click={() => onMenuClick('set-birth-date')} text="Set date of birth" />
      <MenuOption on:click={() => onMenuClick('merge-people')} text="Merge People" />
    </ContextMenu>
  </Portal>
{/if}
