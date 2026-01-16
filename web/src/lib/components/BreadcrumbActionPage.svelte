<script lang="ts">
  import type { HeaderButtonActionItem } from '$lib/types';
  import {
    Breadcrumbs,
    Button,
    Container,
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
    breadcrumbs?: BreadcrumbItem[];
    actions?: Array<HeaderButtonActionItem | MenuItemType>;
    children?: Snippet;
  };

  let { breadcrumbs = [], actions = [], children }: Props = $props();

  const enabledActions = $derived(
    actions
      .filter((action): action is HeaderButtonActionItem => !isMenuItemType(action))
      .filter((action) => action.$if?.() ?? true),
  );
</script>

<div class="h-full flex flex-col">
  <div class="flex h-16 w-full justify-between items-center border-b py-2 px-4 md:px-2">
    <Breadcrumbs items={breadcrumbs} separator={mdiSlashForward} />

    {#if enabledActions.length > 0}
      <div class="hidden md:block">
        <HStack gap={0}>
          {#each enabledActions as action, i (i)}
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
          {/each}
        </HStack>
      </div>

      <ContextMenuButton aria-label={$t('open')} items={actions} class="md:hidden" />
    {/if}
  </div>
  <Scrollable class="grow">
    <Container class="p-2 pb-16" {children} />
  </Scrollable>
</div>
