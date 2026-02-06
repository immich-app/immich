<script lang="ts">
  import AppDownloadModal from '$lib/modals/AppDownloadModal.svelte';
  import ObtainiumConfigModal from '$lib/modals/ObtainiumConfigModal.svelte';
  import { Route } from '$lib/route';
  import { Icon, modalManager, Text } from '@immich/ui';
  import {
    mdiCellphoneArrowDownVariant,
    mdiContentDuplicate,
    mdiCrosshairsGps,
    mdiImageSizeSelectLarge,
    mdiLinkEdit,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const links = [
    { href: Route.duplicatesUtility(), icon: mdiContentDuplicate, label: $t('review_duplicates') },
    { href: Route.largeFileUtility(), icon: mdiImageSizeSelectLarge, label: $t('review_large_files') },
    { href: Route.geolocationUtility(), icon: mdiCrosshairsGps, label: $t('manage_geolocation') },
    // { href: Route.workflows(), icon: mdiStateMachine, label: $t('workflows') },
  ];
</script>

<div class="border border-gray-300 dark:border-immich-dark-gray rounded-3xl pt-1 pb-6 dark:text-white">
  <Text size="tiny" color="muted" fontWeight="medium" class="p-4">{$t('organize_your_library')}</Text>

  {#each links as link (link.href)}
    <a href={link.href} class="w-full hover:bg-gray-100 dark:hover:bg-immich-dark-gray flex items-center gap-4 p-4">
      <span><Icon icon={link.icon} class="text-primary" size="24" /> </span>
      {link.label}
    </a>
  {/each}
</div>
<br />
<div class="border border-gray-300 dark:border-immich-dark-gray rounded-3xl pt-1 pb-6 dark:text-white">
  <Text size="tiny" color="muted" fontWeight="medium" class="p-4">{$t('download')}</Text>

  <button
    type="button"
    onclick={() => modalManager.show(ObtainiumConfigModal, {})}
    class="w-full hover:bg-gray-100 dark:hover:bg-immich-dark-gray flex items-center gap-4 p-4"
  >
    <span>
      <Icon icon={mdiLinkEdit} class="text-immich-primary dark:text-immich-dark-primary" size="24" />
    </span>
    {$t('obtainium_configurator')}
  </button>
  <button
    type="button"
    onclick={() => modalManager.show(AppDownloadModal, {})}
    class="w-full hover:bg-gray-100 dark:hover:bg-immich-dark-gray flex items-center gap-4 p-4"
  >
    <span>
      <Icon icon={mdiCellphoneArrowDownVariant} class="text-immich-primary dark:text-immich-dark-primary" size="24" />
    </span>
    {$t('app_download_links')}
  </button>
</div>
