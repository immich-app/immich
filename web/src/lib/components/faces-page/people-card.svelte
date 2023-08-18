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

  let showContextMenu = false;
  let dispatch = createEventDispatcher<{
    'change-name': void;
    'set-birth-date': void;
    'merge-faces': void;
    'hide-face': void;
  }>();
</script>

<div id="people-card" class="relative">
  <a href="/people/{person.id}" draggable="false">
    <div class="h-48 w-48 rounded-xl brightness-95 filter">
      <ImageThumbnail shadow url={api.getPeopleThumbnailUrl(person.id)} altText={person.name} widthStyle="100%" />
    </div>
    {#if person.name}
      <span class="absolute bottom-2 left-0 w-full select-text px-1 text-center font-medium text-white">
        {person.name}
      </span>
    {/if}
  </a>

  <button
    class="absolute right-2 top-2 z-20"
    on:click|stopPropagation|preventDefault={() => {
      showContextMenu = !showContextMenu;
    }}
    data-testid="context-button-parent"
    id={`icon-${person.id}`}
  >
    <IconButton color="transparent-primary">
      <DotsVertical size="20" />
    </IconButton>

    {#if showContextMenu}
      <ContextMenu on:outclick={() => (showContextMenu = false)}>
        <MenuOption on:click={() => dispatch('hide-face')} text="Hide face" />
        <MenuOption on:click={() => dispatch('change-name')} text="Change name" />
        <MenuOption on:click={() => dispatch('set-birth-date')} text="Set date of birth" />
        <MenuOption on:click={() => dispatch('merge-faces')} text="Merge faces" />
      </ContextMenu>
    {/if}
  </button>
</div>

{#if showContextMenu}
  <Portal target="body">
    <div class="heyo absolute left-0 top-0 z-10 h-screen w-screen bg-transparent" />
  </Portal>
{/if}
