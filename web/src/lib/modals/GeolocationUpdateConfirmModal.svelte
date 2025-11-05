<script lang="ts">
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    location: { latitude: number | undefined; longitude: number | undefined };
    assetCount: number;
    onClose: (confirm?: true) => void;
  }

  let { location, assetCount, onClose }: Props = $props();
</script>

<Modal title={$t('confirm')} size="small" {onClose}>
  <ModalBody>
    <p>
      {$t('update_location_action_prompt', {
        values: {
          count: assetCount,
        },
      })}
    </p>

    <p>- {$t('latitude')}: {location.latitude}</p>
    <p>- {$t('longitude')}: {location.longitude}</p>
  </ModalBody>
  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" type="submit" fullWidth onclick={() => onClose(true)}>{$t('confirm')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
