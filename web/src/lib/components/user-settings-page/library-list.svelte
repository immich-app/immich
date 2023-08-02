<script lang="ts">
  import { api, CreateLibraryDto, LibraryResponseDto } from '@api';
  import { onMount } from 'svelte';
  import LibraryCard from './library-card.svelte';
  import CreateLibraryForm from '../forms/create-library-form.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
  import { handleError } from '$lib/utils/handle-error';

  let libraries: LibraryResponseDto[] = [];

  let newLibrary: Partial<LibraryResponseDto> | null = null;
  let deleteLibrary: LibraryResponseDto | null = null;

  onMount(() => {
    refreshLibraries();
  });

  async function refreshLibraries() {
    const { data } = await api.libraryApi.getAllLibraries();
    libraries = data;
  }

  const handleCreate = async (event: CustomEvent<CreateLibraryDto>) => {
    try {
      const dto = event.detail;
      const { data } = await api.libraryApi.createLibrary({ createLibraryDto: dto });
    } catch (error) {
      handleError(error, 'Unable to create a new library');
    } finally {
      await refreshLibraries();
      newLibrary = null;
    }
  };

  const handleDelete = async () => {
    if (!deleteLibrary) {
      return;
    }

    try {
      await api.libraryApi.deleteLibrary({ id: deleteLibrary.id });
      notificationController.show({
        message: `Removed library: ${deleteLibrary.name}`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to remove library');
    } finally {
      await refreshLibraries();
      deleteLibrary = null;
    }
  };

  $: libraries = libraries;
</script>

{#if newLibrary}
  <CreateLibraryForm
    title="New Library"
    submitText="Create"
    library={newLibrary}
    on:submit={handleCreate}
    on:cancel={() => (newLibrary = null)}
  />
{/if}

{#if deleteLibrary}
  <ConfirmDialogue
    prompt="Are you sure you want to delete this library?"
    on:confirm={() => handleDelete()}
    on:cancel={() => (deleteLibrary = null)}
  />
{/if}

<section class="my-4">
  {#each libraries as library (library.id)}
    <div class="mb-6">
      <LibraryCard {library} />
    </div>
  {/each}
  <div class="mb-2 flex justify-end">
    <Button size="sm" on:click={() => (newLibrary = { name: 'Library' })}>Create new library</Button>
  </div>
</section>
