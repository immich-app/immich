<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import AppDownloadModal from '$lib/modals/AppDownloadModal.svelte';
  import ObtainiumConfigModal from '$lib/modals/ObtainiumConfigModal.svelte';
  import { Route } from '$lib/route';
  import { Icon, modalManager } from '@immich/ui';
  import {
    mdiCellphoneArrowDownVariant,
    mdiContentDuplicate,
    mdiCrosshairsGps,
    mdiImageSizeSelectLarge,
    mdiLinkEdit,
    mdiStateMachine,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  const links = [
    { href: Route.duplicatesUtility(), icon: mdiContentDuplicate, label: $t('review_duplicates') },
    { href: Route.largeFileUtility(), icon: mdiImageSizeSelectLarge, label: $t('review_large_files') },
    { href: Route.geolocationUtility(), icon: mdiCrosshairsGps, label: $t('manage_geolocation') },
    { href: Route.workflows(), icon: mdiStateMachine, label: $t('workflows') },
  ];

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<UserPageLayout title={data.meta.title}>
  <PageContent center size="small" class="pt-10">
    <div class="border border-gray-300 dark:border-immich-dark-gray rounded-3xl pt-1 pb-6 dark:text-white">
      <p class="uppercase text-xs font-medium p-4">{$t('organize_your_library')}</p>

      {#each links as link (link.href)}
        <a href={link.href} class="w-full hover:bg-gray-100 dark:hover:bg-immich-dark-gray flex items-center gap-4 p-4">
          <span><Icon icon={link.icon} class="text-primary" size="24" /> </span>
          {link.label}
        </a>
      {/each}
    </div>
    <br />
    <div class="border border-gray-300 dark:border-immich-dark-gray rounded-3xl pt-1 pb-6 dark:text-white">
      <p class="uppercase text-xs font-medium p-4">{$t('download')}</p>
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
          <Icon
            icon={mdiCellphoneArrowDownVariant}
            class="text-immich-primary dark:text-immich-dark-primary"
            size="24"
          />
        </span>
        {$t('app_download_links')}
      </button>
    </div>
  </PageContent>
</UserPageLayout>
