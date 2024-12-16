<script lang="ts">
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { mdiClose } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    /**
     * Unique identifier for the header text.
     */
    id: string;
    title: string;
    onClose: () => void;
    /**
     * If true, the logo will be displayed next to the modal title.
     */
    showLogo?: boolean;
    /**
     * Optional icon to display next to the modal title, if `showLogo` is false.
     */
    icon?: string;
  }

  let { id, title, onClose, showLogo = false, icon = undefined }: Props = $props();
</script>

<div class="flex place-items-center justify-between px-5 pb-3">
  <div class="flex gap-2 place-items-center">
    {#if showLogo}
      <ImmichLogo noText={true} width={32} />
    {:else if icon}
      <Icon path={icon} size={24} ariaHidden={true} class="text-immich-primary dark:text-immich-dark-primary" />
    {/if}
    <h1 {id}>
      {title}
    </h1>
  </div>

  <CircleIconButton onclick={onClose} icon={mdiClose} size={'20'} title={$t('close')} />
</div>
