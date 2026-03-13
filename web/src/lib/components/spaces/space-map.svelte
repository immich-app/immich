<script lang="ts">
  import { QueryParameter } from '$lib/constants';
  import { Icon } from '@immich/ui';
  import { mdiMapOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    spaceId: string;
  }

  let { spaceId }: Props = $props();

  const mapUrl = $derived(`/map?${QueryParameter.SPACE_ID}=${spaceId}`);
</script>

<a
  href={mapUrl}
  class="flex items-center justify-center rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
  aria-label={$t('map')}
>
  <Icon icon={mdiMapOutline} size="24" />
</a>
