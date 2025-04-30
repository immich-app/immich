<script lang="ts" module>
  export const headerId = 'user-page-header';
</script>

<script lang="ts">
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import NavigationBar from '../shared-components/navigation-bar/navigation-bar.svelte';
  import SideBar from '../shared-components/side-bar/side-bar.svelte';
  import AdminSideBar from '../shared-components/side-bar/admin-side-bar.svelte';
  import { useActions, type ActionArray } from '$lib/actions/use-actions';
  import type { Snippet } from 'svelte';

  interface Props {
    hideNavbar?: boolean;
    showUploadButton?: boolean;
    title?: string | undefined;
    description?: string | undefined;
    scrollbar?: boolean;
    admin?: boolean;
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
    admin = false,
    use = [],
    header,
    sidebar,
    buttons,
    children,
  }: Props = $props();

  let scrollbarClass = $derived(scrollbar ? 'immich-scrollbar p-2' : 'scrollbar-hidden');
  let hasTitleClass = $derived(title ? 'top-16 h-[calc(100%-theme(spacing.16))]' : 'top-0 h-full');
</script>

<header>
  {#if !hideNavbar}
    <NavigationBar {showUploadButton} onUploadClick={() => openFileUploadDialog()} />
  {/if}

  {@render header?.()}
</header>
<div
  tabindex="-1"
  class="relative grid h-dvh grid-cols-[theme(spacing.0)_auto] overflow-hidden bg-immich-bg max-md:pt-[var(--navbar-height-md)] pt-[var(--navbar-height)] dark:bg-immich-dark-bg sidebar:grid-cols-[theme(spacing.64)_auto]"
>
  {#if sidebar}{@render sidebar()}{:else if admin}
    <AdminSideBar />
  {:else}
    <SideBar />
  {/if}

  <main class="relative">
    {#if title || buttons}
      <div
        class="absolute flex h-16 w-full place-items-center justify-between border-b p-2 dark:border-immich-dark-gray dark:text-immich-dark-fg"
      >
        <div class="flex gap-2 items-center">
          {#if title}
            <div class="font-medium outline-none" tabindex="-1" id={headerId}>{title}</div>
          {/if}
          {#if description}
            <p class="text-sm text-gray-400 dark:text-gray-600">{description}</p>
          {/if}
        </div>
        {@render buttons?.()}
      </div>
    {/if}

    <div class="{scrollbarClass} absolute {hasTitleClass} w-full overflow-y-auto" use:useActions={use}>
      {@render children?.()}
    </div>
  </main>
</div>
