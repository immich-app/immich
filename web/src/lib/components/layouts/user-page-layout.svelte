<script lang="ts">
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import NavigationBar from '../shared-components/navigation-bar/navigation-bar.svelte';
  import SideBar from '../shared-components/side-bar/side-bar.svelte';
  import EyeOutline from 'svelte-material-icons/EyeOutline.svelte';
  import Close from 'svelte-material-icons/Close.svelte';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import { fly } from 'svelte/transition';
  import type { UserResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';

  export let user: UserResponseDto;
  export let hideNavbar = false;
  export let showUploadButton = false;
  export let title: string | undefined = undefined;
  export let selectHidden = false;
  export let countTotalPeople: number | undefined = undefined;

  const dispatch = createEventDispatcher();
  const handleDoneClick = () => {
    selectHidden = !selectHidden;
    dispatch('doneClick');
  };
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
          {#if countTotalPeople && countTotalPeople > 0}
            <IconButton on:click={() => (selectHidden = !selectHidden)}>
              <div class="flex items-center">
                <EyeOutline size="1em" />
                <p class="ml-2">Show & hide faces</p>
              </div>
            </IconButton>
          {/if}
          <slot name="buttons" />
        </div>

        <div class="absolute overflow-y-auto top-16 h-[calc(100%-theme(spacing.16))] w-full immich-scrollbar p-4 pb-8">
          <slot />
        </div>
      </section>
    {/if}
  </slot>
</main>
{#if selectHidden}
  <section
    transition:fly={{ y: 500, duration: 100, easing: quintOut }}
    class="absolute top-0 left-0 w-full h-full bg-immich-bg dark:bg-immich-dark-bg z-[9999]"
  >
    <div
      class="absolute border-b dark:border-immich-dark-gray flex justify-between place-items-center dark:text-immich-dark-fg w-full h-16"
    >
      <div class="flex items-center justify-between p-8 w-full">
        <div class="flex items-center">
          <CircleIconButton
            logo={Close}
            on:click={() => {
              selectHidden = !selectHidden;
            }}
          />
          <p class="ml-4">Show & hide faces</p>
        </div>
        <IconButton
          on:click={() => {
            handleDoneClick();
          }}
        >
          Done
        </IconButton>
      </div>
      <div class="absolute top-16 h-[calc(100%-theme(spacing.16))] w-full immich-scrollbar p-4 pb-8">
        <slot />
      </div>
    </div>
  </section>
{/if}
