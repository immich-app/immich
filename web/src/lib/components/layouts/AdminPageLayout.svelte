<script lang="ts">
  import BreadcrumbActionPage from '$lib/components/BreadcrumbActionPage.svelte';
  import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
  import BottomInfo from '$lib/components/shared-components/side-bar/bottom-info.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import type { HeaderButtonActionItem } from '$lib/types';
  import { AppShell, AppShellHeader, AppShellSidebar, MenuItemType, NavbarItem, type BreadcrumbItem } from '@immich/ui';
  import {
    mdiAccountChildCircle,
    mdiAccountMultipleOutline,
    mdiBookshelf,
    mdiCog,
    mdiEmailOutline,
    mdiServer,
    mdiTrayFull,
    mdiWrench,
  } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    breadcrumbs: BreadcrumbItem[];
    actions?: Array<HeaderButtonActionItem | MenuItemType>;
    children?: Snippet;
  };

  let { breadcrumbs, actions, children }: Props = $props();

  const familyMode = $derived(featureFlagsManager.value.familyMode);
</script>

<AppShell>
  <AppShellHeader>
    <NavigationBar noBorder />
  </AppShellHeader>
  <AppShellSidebar
    bind:open={sidebarStore.isOpen}
    class="border-none shadow-none h-full flex flex-col justify-between gap-2"
  >
    <div class="flex flex-col pt-8 pe-4 gap-1">
      <NavbarItem title={$t('users')} href={Route.users()} icon={mdiAccountMultipleOutline} />
      {#if familyMode}
        <NavbarItem title={$t('invitations')} href={Route.invitations()} icon={mdiEmailOutline} />
        <NavbarItem title={$t('family_members')} href={Route.familyMembers()} icon={mdiAccountChildCircle} />
      {/if}
      <NavbarItem title={$t('external_libraries')} href={Route.libraries()} icon={mdiBookshelf} />
      <NavbarItem title={$t('admin.queues')} href={Route.queues()} icon={mdiTrayFull} />
      <NavbarItem title={$t('settings')} href={Route.systemSettings()} icon={mdiCog} />
      <NavbarItem title={$t('admin.maintenance_settings')} href={Route.systemMaintenance()} icon={mdiWrench} />
      <NavbarItem title={$t('server_stats')} href={Route.systemStatistics()} icon={mdiServer} />
    </div>

    <div class="mb-2 me-4">
      <BottomInfo />
    </div>
  </AppShellSidebar>

  <BreadcrumbActionPage {breadcrumbs} {actions}>
    {@render children?.()}
  </BreadcrumbActionPage>
</AppShell>
