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
    <div class="relative h-240 w-full overflow-hidden">
      <iframe
        title={$t('admin.template_email_preview')}
        srcdoc={html}
        class="absolute top-0 left-0 size-full border-none"
      ></iframe>
    </div>
  </ModalBody>
</Modal>
