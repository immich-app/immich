<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    serverVersion: string;
    releaseVersion: string;
    onClose: () => void;
  };

  const { serverVersion, releaseVersion, onClose }: Props = $props();
</script>

<Modal size="small" title="🎉 {$t('new_version_available')}" {onClose} icon={false}>
  <ModalBody>
    <div>
      <FormatMessage key="version_announcement_message">
        {#snippet children({ tag, message })}
          {#if tag === 'link'}
            <span class="font-medium underline">
              <a href="https://github.com/immich-app/immich/releases/latest" target="_blank" rel="noopener noreferrer">
                {message}
              </a>
            </span>
          {:else if tag === 'code'}
            <code>{message}</code>
          {/if}
        {/snippet}
      </FormatMessage>
    </div>

    <div class="mt-4 font-medium">{$t('version_announcement_closing')}</div>

    <div class="font-sm mt-8">
      <code>{$t('server_version')}: {serverVersion}</code>
      <br />
      <code>{$t('latest_version')}: {releaseVersion}</code>
    </div>
  </ModalBody>
  <ModalFooter>
    <Button fullWidth shape="round" onclick={onClose}>{$t('acknowledge')}</Button>
  </ModalFooter>
</Modal>
