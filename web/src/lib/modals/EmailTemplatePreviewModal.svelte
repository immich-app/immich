<script lang="ts">
  import { Modal, ModalBody } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    html: string;
    onClose: () => void;
  }

  let { html, onClose }: Props = $props();
</script>

<Modal title={$t('admin.template_email_preview')} {onClose} size="giant">
  <ModalBody>
    <div class="relative w-full h-240 overflow-hidden">
      <iframe
        title={$t('admin.template_email_preview')}
        srcdoc={html}
        class="absolute top-0 left-0 w-full h-full border-none"
      ></iframe>
    </div>
  </ModalBody>
</Modal>
