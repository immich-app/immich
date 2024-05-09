<script lang="ts">
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { getContextMenuPosition } from '$lib/utils/context-menu';
  import { type PersonResponseDto } from '@immich/sdk';
  import {
    mdiAccountEditOutline,
    mdiAccountMultipleCheckOutline,
    mdiCalendarEditOutline,
    mdiDotsVertical,
    mdiEyeOffOutline,
  } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
  import MenuOption from '../shared-components/context-menu/menu-option.svelte';
  import Portal from '../shared-components/portal/portal.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';

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

  <div class="absolute right-2 top-2" class:hidden={!showVerticalDots}>
    <CircleIconButton
      color="opaque"
      icon={mdiDotsVertical}
      title="Show person options"
      size="20"
      padding="2"
      class="icon-white-drop-shadow"
      on:click={showMenu}
    />
  </div>
</div>

{#if showContextMenu}
  <Portal target="body">
    <ContextMenu {...contextMenuPosition} on:outclick={() => onMenuExit()}>
      <MenuOption on:click={() => onMenuClick('hide-person')} icon={mdiEyeOffOutline} text="Hide person" />
      <MenuOption on:click={() => onMenuClick('change-name')} icon={mdiAccountEditOutline} text="Change name" />
      <MenuOption
        on:click={() => onMenuClick('set-birth-date')}
        icon={mdiCalendarEditOutline}
        text="Set date of birth"
      />
      <MenuOption
        on:click={() => onMenuClick('merge-people')}
        icon={mdiAccountMultipleCheckOutline}
        text="Merge people"
      />
    </ContextMenu>
  </Portal>
{/if}
