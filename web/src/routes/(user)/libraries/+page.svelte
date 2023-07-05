<script lang="ts">
  import LibraryCard from '$lib/components/libraries/library-card.svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
  import { useLibraries } from './libraries.bloc';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import { flip } from 'svelte/animate';

  export let data: PageData;

  const {
    libraries: unsortedLibraries,
    createUploadLibrary,
    createImportLibrary,
    showLibraryContextMenu,
  } = useLibraries({ libraries: data.libraries });

  let libraries = unsortedLibraries;

  const handleCreateUploadLibrary = async () => {
    const newLibrary = await createUploadLibrary();
    if (newLibrary) {
      goto('/libraries/' + newLibrary.id);
    }
  };

  const handleCreateImportLibrary = async () => {
    const newLibrary = await createImportLibrary();
    if (newLibrary) {
      goto('/libraries/' + newLibrary.id);
    }
  };
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
  <div class="flex place-items-center gap-2" slot="buttons">
    <LinkButton on:click={handleCreateUploadLibrary}>
      <div class="flex place-items-center gap-2 text-sm">
        <PlusBoxOutline size="18" />
        Create Upload Library
      </div>
    </LinkButton>
    <LinkButton on:click={handleCreateImportLibrary}>
      <div class="flex place-items-center gap-2 text-sm">
        <PlusBoxOutline size="18" />
        Create Import Library
      </div>
    </LinkButton>
  </div>

  <!-- Library Card -->
  <div class="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
    {#each $libraries as library (library.id)}
      <a data-sveltekit-preload-data="hover" href={`libraries/${library.id}`} animate:flip={{ duration: 200 }}>
        <LibraryCard {library} on:showLibrarycontextmenu={(e) => showLibraryContextMenu(e.detail, library)} />
      </a>
    {/each}
  </div>
</UserPageLayout>
