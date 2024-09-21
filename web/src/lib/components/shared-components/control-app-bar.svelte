<script lang="ts">
  import { browser } from '$app/environment';

  import { onDestroy, onMount } from 'svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { fly } from 'svelte/transition';
  import { mdiClose } from '@mdi/js';
  import { isSelectingAllAssets } from '$lib/stores/assets.store';
  import { t } from 'svelte-i18n';

  export let showBackButton = true;
  export let backIcon = mdiClose;
  export let tailwindClasses = '';
  export let forceDark = false;
  export let onClose: () => void = () => {};

  let appBarBorder = 'bg-immich-bg border border-transparent';

  const onScroll = () => {
    if (window.pageYOffset > 80) {
      appBarBorder = 'border border-gray-200 bg-gray-50 dark:border-gray-600';

      if (forceDark) {
        appBarBorder = 'border border-gray-600';
      }
    } else {
      appBarBorder = 'bg-immich-bg border border-transparent';
    }
  };

  const handleClose = () => {
    $isSelectingAllAssets = false;
    onClose();
  };

  onMount(() => {
    if (browser) {
      document.addEventListener('scroll', onScroll);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('scroll', onScroll);
    }
  });

  $: buttonClass = forceDark ? 'hover:text-immich-dark-gray' : undefined;
</script>

<div in:fly={{ y: 10, duration: 200 }} class="absolute top-0 w-full z-[100] bg-transparent">
  <div
    id="asset-selection-app-bar"
    class={`grid grid-cols-[10%_80%_10%] justify-between sm:grid-cols-[25%_50%_25%] lg:grid-cols-[25%_50%_25%]  ${appBarBorder} mx-2 mt-2 place-items-center rounded-lg p-2 transition-all ${tailwindClasses} dark:bg-immich-dark-gray ${
      forceDark && 'bg-immich-dark-gray text-white'
    }`}
  >
    <div class="flex place-items-center sm:gap-6 justify-self-start dark:text-immich-dark-fg">
      {#if showBackButton}
        <CircleIconButton title={$t('close')} on:click={handleClose} icon={backIcon} size={'24'} class={buttonClass} />
      {/if}
      <slot name="leading" />
    </div>

    <div class="w-full">
      <slot />
    </div>

    <div class="mr-4 flex place-items-center gap-1 justify-self-end">
      <slot name="trailing" />
    </div>
  </div>
</div>
