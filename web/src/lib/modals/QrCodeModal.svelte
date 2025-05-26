<script lang="ts">
  import QRCode from '$lib/components/shared-components/qrcode.svelte';
  import { copyToClipboard } from '$lib/utils';
  import { HStack, IconButton, Input, Modal, ModalBody } from '@immich/ui';
  import { mdiContentCopy, mdiLink } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    title: string;
    value: string;
    onClose: () => void;
  };

  let { title, value, onClose }: Props = $props();

  let modalWidth = $state(0);
</script>

<Modal {title} icon={mdiLink} {onClose} size="small">
  <ModalBody>
    <div class="w-full py-2 px-10">
      <div bind:clientWidth={modalWidth} class="w-full">
        <QRCode {value} width={modalWidth} />
      </div>
    </div>
    <HStack class="w-full pt-3" gap={1}>
      <Input bind:value disabled class="flex flex-row" />
      <div>
        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          icon={mdiContentCopy}
          onclick={() => (value ? copyToClipboard(value) : '')}
          aria-label={$t('copy_link_to_clipboard')}
        />
      </div>
    </HStack>
  </ModalBody>
</Modal>
