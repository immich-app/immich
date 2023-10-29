<script lang="ts">
  import { page } from '$app/stores';
  import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';
  import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
  import StatusBox from '$lib/components/shared-components/status-box.svelte';
  import { AppRoute } from '$lib/constants';
  import { mdiAccountMultipleOutline, mdiCog, mdiServer, mdiSync, mdiTools } from '@mdi/js';
</script>

<SideBarSection>
  <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_USER_MANAGEMENT} draggable="false">
    <SideBarButton
      title="Users"
      icon={mdiAccountMultipleOutline}
      isSelected={$page.route.id === AppRoute.ADMIN_USER_MANAGEMENT}
    />
  </a>
  <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_JOBS} draggable="false">
    <SideBarButton title="Jobs" icon={mdiSync} isSelected={$page.route.id === AppRoute.ADMIN_JOBS} />
  </a>
  <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_SETTINGS} draggable="false">
    <SideBarButton title="Settings" icon={mdiCog} isSelected={$page.route.id === AppRoute.ADMIN_SETTINGS} />
  </a>
  <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_STATS} draggable="false">
    <SideBarButton title="Server Stats" icon={mdiServer} isSelected={$page.route.id === AppRoute.ADMIN_STATS} />
  </a>
  <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_REPAIR} draggable="false">
    <SideBarButton title="Repair" icon={mdiTools} isSelected={$page.route.id === AppRoute.ADMIN_REPAIR} />
  </a>
  <div class="mb-6 mt-auto">
    <StatusBox />
  </div>
</SideBarSection>
