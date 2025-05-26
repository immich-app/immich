<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute } from '$lib/constants';
  import { mdiContentDuplicate, mdiLinkVariant, mdiOpenInNew } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<div class="border border-gray-300 dark:border-immich-dark-gray rounded-3xl pt-1 pb-6 dark:text-white">
  <p class="text-xs font-medium p-4">{$t('organize_your_library').toUpperCase()}</p>

  <a
    href={AppRoute.DUPLICATES}
    class="w-full hover:bg-gray-100 dark:hover:bg-immich-dark-gray flex items-center gap-4 p-4"
  >
    <span
      ><Icon path={mdiContentDuplicate} class="text-immich-primary dark:text-immich-dark-primary" size="24" />
    </span>
    {$t('review_duplicates')}
  </a>
</div>
<br />
<div class="border border-gray-300 dark:border-immich-dark-gray rounded-3xl pt-1 pb-6 dark:text-white">
  <p class="text-xs font-medium p-4">{$t('advanced').toUpperCase()}</p>

  <a
    href={AppRoute.DOWNLOAD_LINKS}
    target="_blank"
    class="w-full hover:bg-gray-100 dark:hover:bg-immich-dark-gray flex items-center gap-4 p-4"
  >
    <span><Icon path={mdiLinkVariant} class="text-immich-primary dark:text-immich-dark-primary" size="24" /> </span>
    {$t('view_download_links')}
    <div class="flex-grow"></div>
    <span>
      <Icon path={mdiOpenInNew} class="text-immich-primary dark:text-immich-dark-primary" size="24" />
    </span>
  </a>
</div>
