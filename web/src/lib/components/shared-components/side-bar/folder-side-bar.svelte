<script lang="ts">
  import BottomInfo from '$lib/components/shared-components/side-bar/bottom-info.svelte';
  import SideBarLink from '$lib/components/shared-components/side-bar/side-bar-link.svelte';
  import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
  import { AppRoute } from '$lib/constants';
  import { mdiImageMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import FolderBrowserSidebar from '$lib/components/shared-components/side-bar/folder-browser-sidebar.svelte';
</script>

<SideBarSection>
  <nav aria-label={$t('primary')}>
    <SideBarLink title="Back to timeline" routeId="/(user)/photos" icon={mdiImageMultipleOutline} isSelected={true} />
  </nav>

  <FolderBrowserSidebar />

  <BottomInfo />
</SideBarSection>
