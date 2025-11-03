<script lang="ts">
  import { Modal, ModalBody } from '@immich/ui';

  type Props = {
    onClose: () => void;
  };

  const { onClose }: Props = $props();
</script>

<Modal size="small" title="Server is restarting" {onClose} icon={false}>
  <ModalBody>
    <div class="font-medium">This page will refresh momentarily.</div>
  </ModalBody>
</Modal>
