<script lang="ts">
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import NavigationBar from '../shared-components/navigation-bar/navigation-bar.svelte';
  import SideBar from '../shared-components/side-bar/side-bar.svelte';
  import AdminSideBar from '../shared-components/side-bar/admin-side-bar.svelte';

  export let hideNavbar = false;
  export let showUploadButton = false;
  export let scrollbar = true;
  export let admin = false;

  $: scrollbarClass = scrollbar ? 'immich-scrollbar pb-8' : 'scrollbar-hidden';
</script>

<header>
  {#if !hideNavbar}
    <NavigationBar {showUploadButton} on:uploadClicked={() => openFileUploadDialog()} />
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

  <div class="relative {scrollbarClass} scrollbar-stable absolute w-full overflow-y-auto">
    <slot />
  </div>
</main>
