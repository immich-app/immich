<script lang="ts">
  import ObtainiumGenerator from '$lib/components/app-links/obtainium-generator.svelte';
  import { Modal, ModalBody } from '@immich/ui';
  // import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<Modal title="Obtainium Configurator" size="large" {onClose}>
  <ModalBody>
    <ObtainiumGenerator />
  </ModalBody>
</Modal>
