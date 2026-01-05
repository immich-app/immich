<script lang="ts">
  import PageContent from '$lib/components/layouts/PageContent.svelte';
  import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
  import AdminSidebar from '$lib/components/AdminSidebar.svelte';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import type { HeaderButtonActionItem } from '$lib/types';
  import {
    AppShell,
    AppShellHeader,
    AppShellSidebar,
    Breadcrumbs,
    Button,
    ContextMenuButton,
    HStack,
    MenuItemType,
    Scrollable,
    isMenuItemType,
    type BreadcrumbItem,
  } from '@immich/ui';
  import { mdiSlashForward } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    breadcrumbs: BreadcrumbItem[];
    actions?: Array<HeaderButtonActionItem | MenuItemType>;
    children?: Snippet;
  };

  let { breadcrumbs, actions = [], children }: Props = $props();
</script>

<AppShell>
  <AppShellHeader>
    <NavigationBar showUploadButton={false} noBorder />
  </AppShellHeader>
  <AppShellSidebar bind:open={sidebarStore.isOpen} class="border-none shadow-none">
    <AdminSidebar />
  </AppShellSidebar>

  <div class="h-full flex flex-col">
    <div class="flex h-16 w-full justify-between items-center border-b py-2 px-4 md:px-2">
      <Breadcrumbs items={breadcrumbs} separator={mdiSlashForward} />

      {#if actions.length > 0}
        <div class="hidden md:block">
          <HStack gap={0}>
            {#each actions as action, i (i)}
              {#if !isMenuItemType(action) && (action.$if?.() ?? true)}
                <Button
                  variant="ghost"
                  size="small"
                  color={action.color ?? 'secondary'}
                  leadingIcon={action.icon}
                  onclick={() => action.onAction(action)}
                  title={action.data?.title}
                >
                  {action.title}
                </Button>
              {/if}
            {/each}
          </HStack>
        </div>

        <ContextMenuButton aria-label={$t('open')} items={actions} class="md:hidden" />
      {/if}
    </div>
    <Scrollable class="grow">
      <PageContent>
        {@render children?.()}
      </PageContent>
    </Scrollable>
  </div>
</AppShell>
