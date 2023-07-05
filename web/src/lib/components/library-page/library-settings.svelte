<script lang="ts">
  import { LibraryType, type LibraryResponseDto } from '@api';
  import SettingAccordion from '../admin-page/settings/setting-accordion.svelte';
  import LibraryImportPaths from './library-import-paths.svelte';

  export let library: LibraryResponseDto;
</script>

{#if library.type === LibraryType.Import}
  <SettingAccordion title="Library Import Paths" subtitle="Manage your library import paths">
    <LibraryImportPaths {library} />
  </SettingAccordion>
{/if}
