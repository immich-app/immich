<script lang="ts">
  import SideBarLink from '$lib/components/shared-components/side-bar/side-bar-link.svelte';
  import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
  import StatusBox from '$lib/components/shared-components/status-box.svelte';
  import { AppRoute } from '$lib/constants';
  import { mdiAccountMultipleOutline, mdiBookshelf, mdiCog, mdiServer, mdiSync, mdiTools } from '@mdi/js';
</script>

<SideBarSection>
  <nav aria-label="Primary">
    <SideBarLink title="Users" routeId={AppRoute.ADMIN_USER_MANAGEMENT} icon={mdiAccountMultipleOutline} />
    <SideBarLink title="Jobs" routeId={AppRoute.ADMIN_JOBS} icon={mdiSync} />
    <SideBarLink title="Settings" routeId={AppRoute.ADMIN_SETTINGS} icon={mdiCog} />
    <SideBarLink title="External Libraries" routeId={AppRoute.ADMIN_LIBRARY_MANAGEMENT} icon={mdiBookshelf} />
    <SideBarLink title="Server Stats" routeId={AppRoute.ADMIN_STATS} icon={mdiServer} />
    <SideBarLink title="Repair" routeId={AppRoute.ADMIN_REPAIR} icon={mdiTools} preloadData={false} />
  </nav>

  <div class="mb-6 mt-auto group-[.sm.closed]:opacity-0 transition-opacity duration-200">
    <div class="pt-6">
      <StatusBox />
    </div>
  </div>
</SideBarSection>
