<script lang="ts">
  import StorageCalculationModal from '$lib/modals/StorageCalculationModal.svelte';
  import { Icon, modalManager } from '@immich/ui';
  import { mdiHarddisk, mdiInformationOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const openStorageCalculationModal = async () => {
    await modalManager.show(StorageCalculationModal);
  };
</script>

<div class="ps-4 text-sm">
  <button
    type="button"
    onclick={openStorageCalculationModal}
    class="p-2 flex justify-between place-items-center place-content-center border border-immich-primary/20 dark:border-immich-dark-primary/10 mt-2 rounded-lg shadow-md dark:bg-immich-dark-primary/10 min-w-52 w-full"
  >
    <div class="flex justify-between w-full place-items-center place-content-center">
      <div class="flex place-items-center place-content-center gap-1">
        <Icon icon={mdiHarddisk} class="text-primary" size="24" />
        <p class="flex text-primary font-medium">
          {$t('storage_calculation_notice_button_text')}
        </p>
      </div>

      <div>
        <Icon icon={mdiInformationOutline} class="hidden sidebar:flex text-primary font-medium" size="18" />
      </div>
    </div>
  </button>
</div>
