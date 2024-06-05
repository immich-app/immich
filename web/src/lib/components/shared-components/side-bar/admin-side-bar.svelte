<script lang="ts">
  import SideBarLink from '$lib/components/shared-components/side-bar/side-bar-link.svelte';
  import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
  import StatusBox from '$lib/components/shared-components/status-box.svelte';
  import { AppRoute } from '$lib/constants';
  import { mdiAccountMultipleOutline, mdiBookshelf, mdiCog, mdiServer, mdiSync, mdiTools } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<SideBarSection>
  <nav aria-label={$t('primary')}>
    <SideBarLink title={$t('users')} routeId={AppRoute.ADMIN_USER_MANAGEMENT} icon={mdiAccountMultipleOutline} />
    <SideBarLink title={$t('jobs')} routeId={AppRoute.ADMIN_JOBS} icon={mdiSync} />
    <SideBarLink title={$t('settings')} routeId={AppRoute.ADMIN_SETTINGS} icon={mdiCog} />
    <SideBarLink title={$t('external_libraries')} routeId={AppRoute.ADMIN_LIBRARY_MANAGEMENT} icon={mdiBookshelf} />
    <SideBarLink title={$t('server_stats')} routeId={AppRoute.ADMIN_STATS} icon={mdiServer} />
    <SideBarLink title={$t('repair')} routeId={AppRoute.ADMIN_REPAIR} icon={mdiTools} preloadData={false} />
  </nav>

  <div class="mb-6 mt-auto">
    <StatusBox />
  </div>
</SideBarSection>
