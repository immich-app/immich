<script lang="ts">
  import { page } from '$app/stores';
  import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';
  import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
  import StatusBox from '$lib/components/shared-components/status-box.svelte';
  import { AppRoute } from '$lib/constants';
  import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
  import Cog from 'svelte-material-icons/Cog.svelte';
  import Server from 'svelte-material-icons/Server.svelte';
  import Sync from 'svelte-material-icons/Sync.svelte';
</script>

<SideBarSection>
  <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_USER_MANAGEMENT} draggable="false">
    <SideBarButton
      title="Users"
      logo={AccountMultipleOutline}
      isSelected={$page.route.id === AppRoute.ADMIN_USER_MANAGEMENT}
    />
  </a>
  <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_JOBS} draggable="false">
    <SideBarButton title="Jobs" logo={Sync} isSelected={$page.route.id === AppRoute.ADMIN_JOBS} />
  </a>
  <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_SETTINGS} draggable="false">
    <SideBarButton title="Settings" logo={Cog} isSelected={$page.route.id === AppRoute.ADMIN_SETTINGS} />
  </a>
  <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_STATS} draggable="false">
    <SideBarButton title="Server Stats" logo={Server} isSelected={$page.route.id === AppRoute.ADMIN_STATS} />
  </a>
  <div class="mb-6 mt-auto">
    <StatusBox />
  </div>
</SideBarSection>
