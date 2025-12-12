<script lang="ts">
  import { Modal, ModalBody } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
  };

  const { onClose }: Props = $props();
</script>

<Modal size="small" title={$t('server_restarting_title')} {onClose} icon={false}>
  <ModalBody>
    <div class="font-medium">{$t('server_restarting_description')}</div>
  </ModalBody>
</Modal>
