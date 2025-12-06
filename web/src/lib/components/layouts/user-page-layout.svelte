<script lang="ts" module>
  export const headerId = 'user-page-header';
</script>

<script lang="ts">
  import { useActions, type ActionArray } from '$lib/actions/use-actions';
  import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
  import UserSidebar from '$lib/components/shared-components/side-bar/user-sidebar.svelte';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { getContext, type Snippet } from 'svelte';
  import type { AppState } from '../../../routes/+layout.svelte';

  interface Props {
    hideNavbar?: boolean;
    showUploadButton?: boolean;
    title?: string | undefined;
    description?: string | undefined;
    scrollbar?: boolean;
    use?: ActionArray;
    header?: Snippet;
    sidebar?: Snippet;
    buttons?: Snippet;
    children?: Snippet;
  }

  let {
    hideNavbar = false,
    showUploadButton = false,
    title = undefined,
    description = undefined,
    scrollbar = true,
    use = [],
    header,
    sidebar,
    buttons,
    children,
  }: Props = $props();

  let scrollbarClass = $derived(scrollbar ? 'immich-scrollbar' : 'scrollbar-hidden');
  let hasTitleClass = $derived(title ? 'top-16 h-[calc(100%-(--spacing(16)))]' : 'top-0 h-full');
  const appState = getContext('AppState') as AppState;
  let isAssetViewer = $derived(appState.isAssetViewer);
</script>

<header>
  {#if !hideNavbar && !isAssetViewer}
    <NavigationBar {showUploadButton} onUploadClick={() => openFileUploadDialog()} />
  {/if}

  {@render header?.()}
</header>
<div
  tabindex="-1"
  class="relative z-0 grid grid-cols-[--spacing(0)_auto] overflow-hidden sidebar:grid-cols-[--spacing(64)_auto]
    {hideNavbar ? 'h-dvh' : 'h-[calc(100dvh-var(--navbar-height))] max-md:h-[calc(100dvh-var(--navbar-height-md))]'}
    {hideNavbar ? 'pt-(--navbar-height)' : ''}
    {hideNavbar ? 'max-md:pt-(--navbar-height-md)' : ''}"
>
  {#if isAssetViewer}
    <div></div>
  {:else if sidebar}
    {@render sidebar()}
  {:else}
    <UserSidebar />
  {/if}

  <main class="relative w-full">
    <div class="{scrollbarClass} absolute {hasTitleClass} w-full overflow-y-auto p-2" use:useActions={use}>
      {@render children?.()}
    </div>

    {#if title || buttons}
      <div class="absolute flex h-16 w-full place-items-center justify-between border-b p-2 text-dark">
        <div class="flex gap-2 items-center">
          {#if title}
            <div class="font-medium outline-none pe-8" tabindex="-1" id={headerId}>{title}</div>
          {/if}
          {#if description}
            <p class="text-sm text-gray-400 dark:text-gray-600">{description}</p>
          {/if}
        </div>
        {@render buttons?.()}
      </div>
    {/if}
  </main>
</div>
