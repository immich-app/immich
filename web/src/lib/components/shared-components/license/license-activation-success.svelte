<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { t } from 'svelte-i18n';
  import { mdiPartyPopper } from '@mdi/js';

  export let onDone: () => void;
</script>

<div class="m-auto w-3/4 text-center flex flex-col place-content-center place-items-center mb-6 dark:text-white">
  <Icon path={mdiPartyPopper} class="text-immich-primary dark:text-immich-dark-primary" size="96" />
  <p class="text-4xl mt-8 font-bold">{$t('license_activated_title')}</p>
  <p class="text-lg mt-6">{$t('license_activated_subtitle')}</p>

  <div class="mt-10 w-full">
    <Button fullwidth on:click={onDone}>OK</Button>
  </div>
</div>
