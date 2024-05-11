<script lang="ts" context="module">
  export enum ToggleVisibilty {
    HIDE_ALL = 'hide-all',
    HIDE_UNNANEMD = 'hide-unnamed',
    VIEW_ALL = 'view-all',
  }
</script>

<script lang="ts">
  import { fly } from 'svelte/transition';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { quintOut } from 'svelte/easing';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { mdiClose, mdiEye, mdiEyeOff, mdiEyeSettings, mdiRestart } from '@mdi/js';
  import { locale } from '$lib/stores/preferences.store';
  import Button from '$lib/components/elements/buttons/button.svelte';

  export let showLoadingSpinner: boolean;
  export let toggleVisibility: ToggleVisibilty = ToggleVisibilty.VIEW_ALL;
  export let screenHeight: number;
  export let countTotalPeople: number;
  export let onClose: () => void;
  export let onReset: () => void;
  export let onChange: (toggleVisibility: ToggleVisibilty) => void;
  export let onDone: () => void;

  const getNextVisibility = (toggleVisibility: ToggleVisibilty) => {
    if (toggleVisibility === ToggleVisibilty.VIEW_ALL) {
      return ToggleVisibilty.HIDE_UNNANEMD;
    } else if (toggleVisibility === ToggleVisibilty.HIDE_UNNANEMD) {
      return ToggleVisibilty.HIDE_ALL;
    } else {
      return ToggleVisibilty.VIEW_ALL;
    }
  };

  const toggleIconOptions: Record<ToggleVisibilty, string> = {
    [ToggleVisibilty.HIDE_ALL]: mdiEyeOff,
    [ToggleVisibilty.HIDE_UNNANEMD]: mdiEyeSettings,
    [ToggleVisibilty.VIEW_ALL]: mdiEye,
  };

  $: toggleIcon = toggleIconOptions[toggleVisibility];
</script>

<section
  transition:fly={{ y: screenHeight, duration: 150, easing: quintOut, opacity: 1 }}
  class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg dark:bg-immich-dark-bg"
>
  <div
    class="fixed top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-white p-1 dark:border-immich-dark-gray dark:bg-black dark:text-immich-dark-fg md:p-8"
  >
    <div class="flex items-center">
      <CircleIconButton title="Close" icon={mdiClose} on:click={onClose} />
      <div class="flex gap-2 items-center">
        <p class="ml-2">Show & hide people</p>
        <p class="text-sm text-gray-400 dark:text-gray-600">({countTotalPeople.toLocaleString($locale)})</p>
      </div>
    </div>
    <div class="flex items-center justify-end">
      <div class="flex items-center md:mr-8">
        <CircleIconButton title="Reset people visibility" icon={mdiRestart} on:click={onReset} />
        <CircleIconButton
          title="Toggle visibility"
          icon={toggleIcon}
          on:click={() => onChange(getNextVisibility(toggleVisibility))}
        />
      </div>
      {#if !showLoadingSpinner}
        <Button on:click={onDone} size="sm" rounded="lg">Done</Button>
      {:else}
        <LoadingSpinner />
      {/if}
    </div>
  </div>

  <div class="flex flex-wrap gap-1 bg-immich-bg p-2 pb-8 dark:bg-immich-dark-bg md:px-8 mt-16">
    <slot />
  </div>
</section>
