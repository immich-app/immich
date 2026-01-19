<script lang="ts">
  import BreadcrumbActionPage from '$lib/components/BreadcrumbActionPage.svelte';
  import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
  import BottomInfo from '$lib/components/shared-components/side-bar/bottom-info.svelte';
  import UserSidebar from '$lib/components/shared-components/side-bar/user-sidebar.svelte';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import type { HeaderButtonActionItem } from '$lib/types';
  import { AppShell, AppShellHeader, AppShellSidebar, MenuItemType, type BreadcrumbItem } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: Array<HeaderButtonActionItem | MenuItemType>;
    sidebar?: Snippet;
    children?: Snippet;
  };

  let { title, breadcrumbs = [], actions, sidebar, children }: Props = $props();
</script>

<AppShell>
  <AppShellHeader>
    <NavigationBar noBorder />
  </AppShellHeader>
  <AppShellSidebar bind:open={sidebarStore.isOpen} border={false} class="h-full flex flex-col justify-between gap-2">
    {#if sidebar}
      {@render sidebar()}
    {:else}
      <div class="flex flex-col pt-8 pe-6 gap-1">
        <UserSidebar />
      </div>

      <div class="pe-6">
        <BottomInfo />
      </div>
    {/if}
  </AppShellSidebar>
  <BreadcrumbActionPage breadcrumbs={[{ title }, ...breadcrumbs]} {actions}>
    {@render children?.()}
  </BreadcrumbActionPage>
</AppShell>
