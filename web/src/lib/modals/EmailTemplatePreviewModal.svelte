<script lang="ts">
  import { getBaseUrl } from '@immich/sdk';
  import { Modal, ModalBody } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    name: string;
    template: string;
    onClose: () => void;
  }

  let { name, template, onClose }: Props = $props();

  const frameName = 'email-template-preview';
</script>

<Modal title={$t('admin.template_email_preview')} {onClose} size="giant">
  <ModalBody>
    <div class="relative h-240 w-full overflow-hidden">
      <iframe
        name={frameName}
        title={$t('admin.template_email_preview')}
        sandbox=""
        class="absolute top-0 left-0 size-full border-none"
      ></iframe>
    </div>
    <form
      method="post"
      action="{getBaseUrl()}/admin/notifications/templates/{name}/preview"
      target={frameName}
      hidden
      {@attach (form) => form.submit()}
    >
      <input type="hidden" name="template" value={template} />
    </form>
  </ModalBody>
</Modal>
