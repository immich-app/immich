<script lang="ts">
  import { Modal, ModalBody } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<Modal title={$t('deduplication_info')} size="small" {onClose}>
  <ModalBody>
    <div class="text-sm dark:text-white">
      <p>{$t('deduplication_info_description')}</p>
      <ol class="ms-8 mt-2" style="list-style: decimal">
        <li>{$t('deduplication_criteria_1')}</li>
        <li>{$t('deduplication_criteria_2')}</li>
      </ol>
    </div>
  </ModalBody>
</Modal>
