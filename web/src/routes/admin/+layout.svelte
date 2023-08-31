<script lang="ts">
  // DO NOT include `import { page } from '$app/stores'` here, because this can
  // lead to pages not being unmounted, which then causes weird page nesting
  // and routing issues.
  //
  // This is an issue in SvelteKit caused by using the page store in layouts and
  // using transitions on pages: https://github.com/sveltejs/kit/issues/7405

  import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';
  import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
  import Sync from 'svelte-material-icons/Sync.svelte';
  import Cog from 'svelte-material-icons/Cog.svelte';
  import Server from 'svelte-material-icons/Server.svelte';
  import StatusBox from '$lib/components/shared-components/status-box.svelte';
  import { AppRoute } from '../../lib/constants';
  import type { LayoutData } from './$types';
  import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';

  export let data: LayoutData;

  // Circumvents the need to import the page store. Should be replaced by
  // `$page.data.meta.title` once issue #7405 of SvelteKit is resolved.
  const getPageTitle = (routeId: string | null) => {
    switch (routeId) {
      case AppRoute.ADMIN_USER_MANAGEMENT:
        return 'User Management';
      case AppRoute.ADMIN_SETTINGS:
        return 'System Settings';
      case AppRoute.ADMIN_JOBS:
        return 'Jobs';
      case AppRoute.ADMIN_STATS:
        return 'Server Stats';
      default:
        return '';
    }
  };
</script>

<UserPageLayout user={data.user} showUploadButton={false} title={getPageTitle(data.routeId)}>
  <SideBarSection slot="sidebar">
    <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_USER_MANAGEMENT} draggable="false">
      <SideBarButton
        title="Users"
        logo={AccountMultipleOutline}
        isSelected={data.routeId === AppRoute.ADMIN_USER_MANAGEMENT}
      />
    </a>
    <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_JOBS} draggable="false">
      <SideBarButton title="Jobs" logo={Sync} isSelected={data.routeId === AppRoute.ADMIN_JOBS} />
    </a>
    <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_SETTINGS} draggable="false">
      <SideBarButton title="Settings" logo={Cog} isSelected={data.routeId === AppRoute.ADMIN_SETTINGS} />
    </a>
    <a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_STATS} draggable="false">
      <SideBarButton title="Server Stats" logo={Server} isSelected={data.routeId === AppRoute.ADMIN_STATS} />
    </a>
    <div class="mb-6 mt-auto">
      <StatusBox />
    </div>
  </SideBarSection>

  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 pt-5 sm:w-5/6 md:w-[850px]">
      <slot />
    </section>
  </section>
</UserPageLayout>
