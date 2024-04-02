<script lang="ts">
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { createEventDispatcher } from 'svelte';
  import { mdiClose } from '@mdi/js';

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  /**
   * Unique identifier for the header text.
   */
  export let id: string;
  export let title: string;
  /**
   * If true, the logo will be displayed next to the modal title.
   */
  export let showLogo = false;
  /**
   * Optional icon to display next to the modal title, if `showLogo` is false.
   */
  export let icon: string | undefined = undefined;
</script>

<div class="flex place-items-center justify-between px-5 py-3">
  <div class="flex items-center">
    {#if showLogo}
      <ImmichLogo noText={true} width={24} />
      <div class="w-2" />
    {:else if icon}
      <Icon path={icon} size={24} ariaHidden={true} class="text-immich-primary dark:text-immich-dark-primary" />
      <div class="w-2" />
    {/if}
    <h1 id={`${id}-title`} class="text-xl font-medium text-immich-primary dark:text-immich-dark-primary mt-1">
      {title}
    </h1>
  </div>

  <CircleIconButton on:click={() => dispatch('close')} icon={mdiClose} size={'20'} title="Close" />
</div>
