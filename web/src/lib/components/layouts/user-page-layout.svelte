<script lang="ts">
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import RootLayout from '$lib/components/layouts/root-layout.svelte';
  import NavigationBar from '../shared-components/navigation-bar/navigation-bar.svelte';
  import SideBar from '../shared-components/side-bar/side-bar.svelte';
  import AdminSideBar from '../shared-components/side-bar/admin-side-bar.svelte';

  export let hideNavbar = false;
  export let showUploadButton = false;
  export let title: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let scrollbar = true;
  export let admin = false;
  export let noMargin = false;

  let scrollbarClass = '';

  $: {
    if (scrollbar) {
      scrollbarClass = 'immich-scrollbar';
      if (!noMargin) {
        scrollbarClass += ' px-2 pt-2 pb-8';
      }
    } else {
      scrollbarClass = 'scrollbar-hidden';
    }
  }

  $: hasTitleClass = title ? 'top-16 h-[calc(100%-theme(spacing.16))]' : 'top-0 h-full';
</script>

<RootLayout
  className="relative grid grid-cols-[0_auto] md:grid-cols-[theme(spacing.18)_auto] lg:grid-cols-[theme(spacing.64)_auto]
  overflow-hidden bg-immich-bg pt-[var(--navbar-height)] dark:bg-immich-dark-bg"
>
  <header slot="header">
    {#if !hideNavbar}
      <NavigationBar {showUploadButton} on:uploadClicked={() => openFileUploadDialog()} />
    {/if}

    <slot name="header" />
  </header>

  <slot name="sidebar">
    {#if admin}
      <AdminSideBar />
    {:else}
      <SideBar />
    {/if}
  </slot>

  <section class="relative">
    {#if title}
      <div
        class="absolute flex h-16 w-full place-items-center justify-between border-b p-4 dark:border-immich-dark-gray dark:text-immich-dark-fg"
      >
        <div class="flex gap-2 mr-4 items-center">
          <div class="font-medium">{title}</div>
          {#if description}
            <p class="text-sm text-gray-400 dark:text-gray-600">{description}</p>
          {/if}
        </div>
        <div class="relative w-full">
          <div class="ml-auto w-fit">
            <slot name="buttons" />
          </div>
        </div>
      </div>
    {/if}

    <div class="{scrollbarClass} scrollbar-stable absolute {hasTitleClass} w-full overflow-y-auto">
      <slot />
    </div>
  </section>
</RootLayout>
