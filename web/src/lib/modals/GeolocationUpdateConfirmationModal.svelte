<script lang="ts">
  import { Button, Modal, ModalBody } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    location: { latitude: number | undefined; longitude: number | undefined };
    assetCount: number;
    onClose: () => void;
    onUpdateLocation: () => void;
  }

  let { location, assetCount, onClose, onUpdateLocation }: Props = $props();
</script>

<Modal title={$t('update_location')} size="small" {onClose}>
  <ModalBody>
    <p>
      {$t('update_location_action_prompt', {
        values: {
          count: assetCount,
        },
      })}
    </p>

    <div class="text-left text-sm">
      <p>- {$t('latitude')}: {location.latitude}</p>
      <p>- {$t('longitude')}: {location.longitude}</p>
    </div>

    <div class="flex gap-2">
      <Button color="primary" variant="ghost" onclick={onClose}>{$t('cancel')}</Button>
      <Button
        color="primary"
        variant="ghost"
        onclick={() => {
          onUpdateLocation();
          onClose();
        }}>{$t('action_common_update')}</Button
      >
    </div>
  </ModalBody>
</Modal>
