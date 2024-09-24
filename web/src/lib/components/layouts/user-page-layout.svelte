<script lang="ts" context="module">
  export const headerId = 'user-page-header';
</script>

<script lang="ts">
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import NavigationBar from '../shared-components/navigation-bar/navigation-bar.svelte';
  import SideBar from '../shared-components/side-bar/side-bar.svelte';
  import AdminSideBar from '../shared-components/side-bar/admin-side-bar.svelte';

  export let hideNavbar = false;
  export let showUploadButton = false;
  export let title: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let scrollbar = true;
  export let admin = false;

  $: scrollbarClass = scrollbar ? 'immich-scrollbar p-2 pb-8' : 'scrollbar-hidden';
  $: hasTitleClass = title ? 'top-16 h-[calc(100%-theme(spacing.16))]' : 'top-0 h-full';
</script>

<header>
  {#if !hideNavbar}
    <NavigationBar {showUploadButton} onUploadClick={() => openFileUploadDialog()} />
  {/if}

  <slot name="header" />
</header>
<main
  tabindex="-1"
  class="relative grid h-screen grid-cols-[theme(spacing.18)_auto] overflow-hidden bg-immich-bg pt-[var(--navbar-height)] dark:bg-immich-dark-bg md:grid-cols-[theme(spacing.64)_auto]"
>
  <slot name="sidebar">
    {#if admin}
      <AdminSideBar />
    {:else}
      <SideBar />
    {/if}
  </slot>

  <section class="relative">
    {#if title || $$slots.buttons}
      <div
        class="absolute flex h-16 w-full place-items-center justify-between border-b p-4 dark:border-immich-dark-gray dark:text-immich-dark-fg"
      >
        <div class="flex gap-2 items-center">
          {#if title}
            <div class="font-medium" tabindex="-1" id={headerId}>{title}</div>
          {/if}
          {#if description}
            <p class="text-sm text-gray-400 dark:text-gray-600">{description}</p>
          {/if}
        </div>
        <slot name="buttons" />
      </div>
    {/if}

    <div class="{scrollbarClass} scrollbar-stable absolute {hasTitleClass} w-full overflow-y-auto">
      <slot />
    </div>
  </section>
</main>
