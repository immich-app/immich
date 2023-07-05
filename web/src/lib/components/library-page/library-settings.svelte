<script lang="ts">
  import type { LibraryResponseDto } from '@api';
  import SettingAccordion from '../admin-page/settings/setting-accordion.svelte';
  import LibraryImportPaths from './library-import-paths.svelte';

  export let library: LibraryResponseDto;
</script>

<SettingAccordion title="Library Import Paths" subtitle="Manage your library import paths">
  <LibraryImportPaths {library} />
</SettingAccordion>
