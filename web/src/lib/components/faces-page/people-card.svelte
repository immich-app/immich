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
  let dispatch = createEventDispatcher();

  const onChangeNameClicked = () => {
    dispatch('change-name', person);
  };

  const onMergeFacesClicked = () => {
    dispatch('merge-faces', person);
  };
</script>

<div id="people-card" class="relative">
  <a href="/people/{person.id}" draggable="false">
    <div class="filter brightness-95 rounded-xl w-48">
      <ImageThumbnail shadow url={api.getPeopleThumbnailUrl(person.id)} altText={person.name} widthStyle="100%" />
    </div>
    {#if person.name}
      <span
        class="absolute bottom-2 w-full text-center font-medium text-white text-ellipsis w-100 px-1 hover:cursor-pointer backdrop-blur-[1px]"
      >
        {person.name}
      </span>
    {/if}
  </a>

  <button
    class="absolute top-2 right-2 z-20"
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
        <MenuOption on:click={() => onChangeNameClicked()} text="Change name" />
        <MenuOption on:click={() => onMergeFacesClicked()} text="Merge faces" />
      </ContextMenu>
    {/if}
  </button>
</div>

{#if showContextMenu}
  <Portal target="body">
    <div class="absolute top-0 left-0 heyo w-screen h-screen bg-transparent z-10" />
  </Portal>
{/if}
