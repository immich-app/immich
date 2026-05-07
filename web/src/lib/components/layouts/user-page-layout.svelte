<script lang="ts" module>
  export const headerId = 'user-page-header';
</script>

<script lang="ts">
  import { useActions, type ActionArray } from '$lib/actions/use-actions';
  import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
  import UserSidebar from '$lib/components/shared-components/side-bar/user-sidebar.svelte';
  import type { HeaderButtonActionItem } from '$lib/types';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { Button, ContextMenuButton, HStack, isMenuItemType, type MenuItemType } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    hideNavbar?: boolean;
    title?: string | undefined;
    description?: string | undefined;
    scrollbar?: boolean;
    use?: ActionArray;
    actions?: Array<HeaderButtonActionItem | MenuItemType>;
    leading?: Snippet;
    descriptionTrailing?: Snippet;
    sidebar?: Snippet;
    buttons?: Snippet;
    children?: Snippet;
  }

  let {
    hideNavbar = false,
    title = undefined,
    description = undefined,
    scrollbar = true,
    use = [],
    actions = [],
    leading,
    descriptionTrailing,
    sidebar,
    buttons,
    children,
  }: Props = $props();

  const enabledActions = $derived(
    actions
      .filter((action): action is HeaderButtonActionItem => !isMenuItemType(action))
      .filter((action) => action.$if?.() ?? true),
  );

  let scrollbarClass = $derived(scrollbar ? 'immich-scrollbar' : 'scrollbar-hidden');
  let hasHeaderRow = $derived(!!(title || buttons));
  let hasTitleClass = $derived(hasHeaderRow ? 'top-16 h-[calc(100%-(--spacing(16)))]' : 'top-0 h-full');
</script>

<header>
  {#if !hideNavbar}
    <NavigationBar onUploadClick={() => openFileUploadDialog()} />
  {/if}
</header>
<div
  tabindex="-1"
  class="relative z-0 grid grid-cols-[--spacing(0)_auto] overflow-hidden sidebar:grid-cols-[--spacing(64)_auto]
    {hideNavbar ? 'h-dvh' : 'h-[calc(100dvh-var(--navbar-height))] max-md:h-[calc(100dvh-var(--navbar-height-md))]'}
    {hideNavbar ? 'pt-(--navbar-height)' : ''}
    {hideNavbar ? 'max-md:pt-(--navbar-height-md)' : ''}"
>
  {#if sidebar}
    {@render sidebar()}
  {:else}
    <UserSidebar />
  {/if}

  <main class="relative">
    <div class="{scrollbarClass} absolute {hasTitleClass} w-full overflow-y-auto p-2" use:useActions={use}>
      {@render children?.()}
    </div>

    {#if !hideNavbar && (title || buttons)}
      <div class="absolute flex h-16 w-full place-items-center justify-between border-b p-2 text-dark">
        <div class="flex min-w-0 flex-1 gap-2 items-center overflow-hidden" data-testid="page-header-title-row">
          {@render leading?.()}
          {#if title}
            <div class="min-w-0 truncate outline-none pe-8" tabindex="-1" id={headerId} data-testid="page-header">
              {title}
            </div>
          {/if}
          {#if description}
            <p
              class="shrink-0 whitespace-nowrap text-sm text-gray-400 dark:text-gray-600"
              data-testid="page-header-description"
            >
              {description}
            </p>
          {/if}
          {#if descriptionTrailing}
            <div class="shrink-0" data-testid="page-header-description-trailing">
              {@render descriptionTrailing()}
            </div>
          {/if}
        </div>

        {@render buttons?.()}

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
    {/if}
  </main>
</div>
