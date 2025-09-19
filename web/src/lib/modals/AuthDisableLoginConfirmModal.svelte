<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiCancel } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: (confirmed?: boolean) => void;
  }

  let { onClose }: Props = $props();
</script>

<Modal title={$t('admin.disable_login')} icon={mdiCancel} size="small" {onClose}>
  <ModalBody>
    <div class="flex flex-col gap-4 text-center">
      <p>{$t('admin.authentication_settings_disable_all')}</p>
      <p>
        <FormatMessage key="admin.authentication_settings_reenable">
          {#snippet children({ message })}
            <a
              href="https://immich.app/docs/administration/server-commands"
              rel="noreferrer"
              target="_blank"
              class="underline"
            >
              {message}
            </a>
          {/snippet}
        </FormatMessage>
      </p>
    </div>
  </ModalBody>
  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose(false)}>
        {$t('cancel')}
      </Button>
      <Button shape="round" color="danger" fullWidth onclick={() => onClose(true)}>
        {$t('confirm')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
