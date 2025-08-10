<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import AppDownloadModal from '$lib/modals/AppDownloadModal.svelte';
  import ObtainiumConfigModal from '$lib/modals/ObtainiumConfigModal.svelte';
  import { modalManager } from '@immich/ui';
  import { mdiCellphoneArrowDownVariant, mdiLinkEdit } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<div class="flex gap-4">
  <button
    type="button"
    onclick={() => modalManager.show(ObtainiumConfigModal, {})}
    class="w-full border-immich-primary border-[3px] hover:bg-gray-100 dark:hover:bg-immich-dark-gray flex items-center gap-4 p-4"
    ><span><Icon path={mdiLinkEdit} class="text-immich-primary dark:text-immich-dark-primary" size="24" /> </span>
    {$t('obtainium_configurator')}
  </button>
  <button
    type="button"
    onclick={() => modalManager.show(AppDownloadModal, {})}
    class="w-full border-immich-primary border-[3px] hover:bg-gray-100 dark:hover:bg-immich-dark-gray flex items-center gap-4 p-4"
    ><span
      ><Icon path={mdiCellphoneArrowDownVariant} class="text-immich-primary dark:text-immich-dark-primary" size="24" />
    </span>
    {$t('app_download_links')}
  </button>
</div>
