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
    <div class="w-48 rounded-xl brightness-95 filter">
      <ImageThumbnail shadow url={api.getPeopleThumbnailUrl(person.id)} altText={person.name} widthStyle="100%" />
    </div>
    {#if person.name}
      <span
        class="w-100 absolute bottom-2 w-full text-ellipsis px-1 text-center font-medium text-white backdrop-blur-[1px] hover:cursor-pointer"
      >
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
        <MenuOption on:click={() => onChangeNameClicked()} text="Change name" />
        <MenuOption on:click={() => onMergeFacesClicked()} text="Merge faces" />
      </ContextMenu>
    {/if}
  </button>
</div>

{#if showContextMenu}
  <Portal target="body">
    <div class="heyo absolute left-0 top-0 z-10 h-screen w-screen bg-transparent" />
  </Portal>
{/if}
