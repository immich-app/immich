<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import { Icon } from '@immich/ui';
  import { mdiContentDuplicate, mdiCrosshairsGps, mdiImageSizeSelectLarge } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const links = [
    { href: AppRoute.DUPLICATES, icon: mdiContentDuplicate, label: $t('review_duplicates') },
    { href: AppRoute.LARGE_FILES, icon: mdiImageSizeSelectLarge, label: $t('review_large_files') },
    { href: AppRoute.GEOLOCATION, icon: mdiCrosshairsGps, label: $t('manage_geolocation') },
  ];
</script>

<div class="border border-gray-300 dark:border-immich-dark-gray rounded-3xl pt-1 pb-6 dark:text-white">
  <p class="uppercase text-xs font-medium p-4">{$t('organize_your_library')}</p>

  {#each links as link (link.href)}
    <a href={link.href} class="w-full hover:bg-gray-100 dark:hover:bg-immich-dark-gray flex items-center gap-4 p-4">
      <span><Icon icon={link.icon} class="text-primary" size="24" /> </span>
      {link.label}
    </a>
  {/each}
</div>
