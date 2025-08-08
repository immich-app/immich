<script lang="ts">
  import AppDownloadLinks from '$lib/components/app-links/app-download-links.svelte';
  import { Modal, ModalBody } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<Modal title={$t('app_download_links')} size="large" {onClose}>
  <ModalBody>
    <AppDownloadLinks />
  </ModalBody>
</Modal>
