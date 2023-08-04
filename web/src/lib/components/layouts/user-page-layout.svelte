<script lang="ts">
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import type { UserResponseDto } from '@api';
  import NavigationBar from '../shared-components/navigation-bar/navigation-bar.svelte';
  import SideBar from '../shared-components/side-bar/side-bar.svelte';
  export let user: UserResponseDto;
  export let hideNavbar = false;
  export let showUploadButton = false;
  export let title: string | undefined = undefined;
  export let scrollbar = true;

  $: scrollbarClass = scrollbar ? 'immich-scrollbar p-4 pb-8' : 'scrollbar-hidden pl-4';
</script>

<header>
  {#if !hideNavbar}
    <NavigationBar {user} {showUploadButton} on:uploadClicked={() => openFileUploadDialog()} />
  {/if}

  <slot name="header" />
</header>
<main
  class="relative grid h-screen grid-cols-[theme(spacing.18)_auto] overflow-hidden bg-immich-bg pt-[var(--navbar-height)] dark:bg-immich-dark-bg md:grid-cols-[theme(spacing.64)_auto]"
>
  <slot name="sidebar">
    <SideBar />
  </slot>
  <slot name="content">
    {#if title}
      <section class="relative">
        <div
          class="absolute flex h-16 w-full place-items-center justify-between border-b p-4 dark:border-immich-dark-gray dark:text-immich-dark-fg"
        >
          <p class="font-medium">{title}</p>
          <slot name="buttons" />
        </div>

        <div class="{scrollbarClass} absolute top-16 h-[calc(100%-theme(spacing.16))] w-full overflow-y-auto">
          <slot />
        </div>
      </section>
    {/if}
  </slot>
</main>
