<script lang="ts">
  import RadioButton from '$lib/elements/RadioButton.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetOrder, TimelineSortBy, updateMyPreferences } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: (result?: { sortBy: TimelineSortBy; sortOrder: AssetOrder }) => void;
  }

  let { onClose }: Props = $props();

  let sortBy = $state($preferences?.timeline?.sortBy ?? TimelineSortBy.Captured);
  let sortOrder = $state($preferences?.timeline?.sortOrder ?? AssetOrder.Desc);

  const handleSave = async () => {
    try {
      const data = await updateMyPreferences({
        userPreferencesUpdateDto: {
          timeline: { sortBy, sortOrder },
        },
      });

      $preferences = { ...data };
      toastManager.success($t('saved_settings'));
      onClose({ sortBy, sortOrder });
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_settings'));
    }
  };
</script>

<Modal title={$t('sort')} onClose={() => onClose()} size="small">
  <ModalBody>
    <div class="flex flex-col gap-4">
      <fieldset>
        <legend class="uppercase immich-form-label mb-2">{$t('sort_by')}</legend>
        <div class="flex flex-col gap-2">
          <RadioButton
            name="sort-by"
            id="sort-captured"
            bind:group={sortBy}
            label={$t('capture_date')}
            value={TimelineSortBy.Captured}
          />
          <RadioButton
            name="sort-by"
            id="sort-uploaded"
            bind:group={sortBy}
            label={$t('upload_date')}
            value={TimelineSortBy.Uploaded}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend class="uppercase immich-form-label mb-2">{$t('order')}</legend>
        <div class="flex flex-col gap-2">
          <RadioButton
            name="sort-order"
            id="order-desc"
            bind:group={sortOrder}
            label={$t('newest_first')}
            value={AssetOrder.Desc}
          />
          <RadioButton
            name="sort-order"
            id="order-asc"
            bind:group={sortOrder}
            label={$t('oldest_first')}
            value={AssetOrder.Asc}
          />
        </div>
      </fieldset>
    </div>
  </ModalBody>
  <ModalFooter>
    <HStack>
      <Button fullwidth color="secondary" on:click={() => onClose()}>{$t('cancel')}</Button>
      <Button fullwidth on:click={handleSave}>{$t('save')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
