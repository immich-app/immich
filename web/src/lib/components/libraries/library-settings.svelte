<script lang="ts">
  import { LibraryType, type LibraryResponseDto, api } from '@api';
  import SettingAccordion from '../admin-page/settings/setting-accordion.svelte';
  import LibraryImportPaths from './library-import-paths.svelte';
  import Button from '../elements/buttons/button.svelte';

  export let library: LibraryResponseDto;

  const refreshLibrary = async () => {
    await api.libraryApi.refreshLibrary({ id: library.id, scanLibraryDto: {} });
  };

  const forceRefresh = async () => {
    await api.libraryApi.refreshLibrary({ id: library.id, scanLibraryDto: { forceRefresh: true } });
  };

  const emptyTrash = async () => {
    await api.libraryApi.refreshLibrary({ id: library.id, scanLibraryDto: { emptyTrash: true } });
  };
</script>

{#if library.type === LibraryType.Import}
  <SettingAccordion title="Library Import Paths" subtitle="Manage your library import paths">
    <LibraryImportPaths {library} />
  </SettingAccordion>
  <div class="flex justify-end">
    <Button size="sm" on:click={refreshLibrary}>Scan library</Button>
    <Button size="sm" on:click={forceRefresh}>Force refresh</Button>
    <Button color="red" size="sm" on:click={emptyTrash}>Empty trash</Button>
  </div>
{/if}
