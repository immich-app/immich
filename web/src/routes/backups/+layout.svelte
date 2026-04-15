<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
  import { Route } from '$lib/route';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { AppShell, AppShellHeader, AppShellSidebar, NavbarItem } from '@immich/ui';
  import { mdiBackupRestore, mdiClock, mdiCog, mdiViewDashboard } from '@mdi/js';
  import { OnboardingGate, orchestrationApiProvider, sdk, setProvider, YuccaContext } from 'orchestration-ui';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  sdk.defaults.baseUrl = window.location.origin;
  setProvider(orchestrationApiProvider);
</script>

<AppShell>
  <AppShellHeader>
    <NavigationBar noBorder />
  </AppShellHeader>

  <AppShellSidebar bind:open={sidebarStore.isOpen}>
    <div class="flex flex-col pt-8 pe-4 gap-1">
      <NavbarItem
        title="Dashboard"
        href={Route.backups()}
        icon={mdiViewDashboard}
        isActive={() => page.url.pathname === '/backups'}
      />
      <NavbarItem title="Repositories" href={Route.backupsRepositories()} icon={mdiBackupRestore} />
      <NavbarItem title="Schedules" href={Route.backupsSchedules()} icon={mdiClock} />
      <NavbarItem title="Configure" href={Route.backupsConfig()} icon={mdiCog} />
    </div>
  </AppShellSidebar>

  <YuccaContext baseUrl={window.location.origin}>
    <div class="p-4 flex flex-col gap-2 max-w-6xl m-auto">
      <OnboardingGate flow="immich-setup" onExit={() => goto('/')}>
        {@render children()}
      </OnboardingGate>
    </div>
  </YuccaContext>
</AppShell>
