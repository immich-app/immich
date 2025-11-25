<script lang="ts">
  import PageContent from '$lib/components/layouts/PageContent.svelte';
  import TitleLayout from '$lib/components/layouts/TitleLayout.svelte';
  import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
  import AdminSidebar from '$lib/sidebars/AdminSidebar.svelte';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { AppShell, AppShellHeader, AppShellSidebar, Scrollable, type BreadcrumbItem } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    breadcrumbs: BreadcrumbItem[];
    buttons?: Snippet;
    children?: Snippet;
  };

  let { breadcrumbs, buttons, children }: Props = $props();
</script>

<AppShell>
  <AppShellHeader>
    <NavigationBar showUploadButton={false} noBorder />
  </AppShellHeader>
  <AppShellSidebar bind:open={sidebarStore.isOpen} class="border-none shadow-none">
    <AdminSidebar />
  </AppShellSidebar>

  <TitleLayout {breadcrumbs} {buttons}>
    <Scrollable class="grow">
      <PageContent>
        {@render children?.()}
      </PageContent>
    </Scrollable>
  </TitleLayout>
</AppShell>
