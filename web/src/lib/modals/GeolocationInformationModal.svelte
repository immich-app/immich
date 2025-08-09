<script lang="ts">
  import { Modal, ModalBody } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<Modal title={$t('geolocation_update_info')} size="medium" {onClose}>
  <ModalBody>
    <div class="text-sm dark:text-white">
      <p>{$t('geolocation_info_description')}</p>
      <ol class="ms-8 mt-2" style="list-style: decimal">
        <li>{$t('geolocation_criteria_1')}</li>
        <li>{$t('geolocation_criteria_2')}</li>
        <li>{$t('geolocation_criteria_3')}</li>
        <li>{$t('geolocation_criteria_4')}</li>
      </ol>
    </div>
  </ModalBody>
</Modal>
