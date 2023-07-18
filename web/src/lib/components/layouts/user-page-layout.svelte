<script lang="ts">
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import type { UserResponseDto } from '@api';
  import NavigationBar from '../shared-components/navigation-bar/navigation-bar.svelte';
  import SideBar from '../shared-components/side-bar/side-bar.svelte';
  export let user: UserResponseDto;
  export let hideNavbar = false;
  export let showUploadButton = false;
  export let title: string | undefined = undefined;
</script>

<header>
  {#if !hideNavbar}
    <NavigationBar {user} {showUploadButton} on:uploadClicked={() => openFileUploadDialog()} />
  {/if}

  <slot name="header" />
</header>
<main
  class="grid md:grid-cols-[theme(spacing.64)_auto] grid-cols-[theme(spacing.18)_auto] relative pt-[var(--navbar-height)] h-screen overflow-hidden bg-immich-bg dark:bg-immich-dark-bg"
>
  <slot name="sidebar">
    <SideBar />
  </slot>
  <slot name="content">
    {#if title}
      <section class="relative">
        <div
          class="absolute border-b dark:border-immich-dark-gray flex justify-between place-items-center dark:text-immich-dark-fg w-full p-4 h-16"
        >
          <p class="font-medium">{title}</p>
          <slot name="buttons" />
        </div>

        <div class="absolute overflow-y-auto top-16 h-[calc(100%-theme(spacing.16))] w-full immich-scrollbar p-4 pb-8">
          <slot />
        </div>
      </section>
    {/if}
  </slot>
</main>
