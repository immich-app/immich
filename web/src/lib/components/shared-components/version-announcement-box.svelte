<script lang="ts">
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import { websocketStore } from '$lib/stores/websocket';
  import type { ServerVersionResponseDto } from '@immich/sdk';
  import { Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import Button from '../elements/buttons/button.svelte';

  let showModal = $state(false);

  const { release } = websocketStore;

  const semverToName = ({ major, minor, patch }: ServerVersionResponseDto) => `v${major}.${minor}.${patch}`;

  const onAcknowledge = () => {
    localStorage.setItem('appVersion', releaseVersion);
    sessionStorage.setItem('modalAcknowledged', 'true');
    showModal = false;
  };

  const handleRelease = () => {
    try {
      if (localStorage.getItem('appVersion') === releaseVersion) {
        return;
      }

      showModal = true;
    } catch (error) {
      console.error('Error [VersionAnnouncementBox]:', error);
    }
  };
  let releaseVersion = $derived($release && semverToName($release.releaseVersion));
  let serverVersion = $derived($release && semverToName($release.serverVersion));
  $effect(() => {
    if ($release?.isAvailable && !sessionStorage.getItem('modalAcknowledged')) {
      handleRelease();
    }
  });
</script>

{#if showModal}
  <Modal title="🎉 {$t('new_version_available')}" onClose={() => (showModal = false)}>
    <ModalBody>
      <div>
        <FormatMessage key="version_announcement_message">
          {#snippet children({ tag, message })}
            {#if tag === 'link'}
              <span class="font-medium underline">
                <a
                  href="https://github.com/immich-app/immich/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
      <Button fullwidth onclick={onAcknowledge}>{$t('acknowledge')}</Button>
    </ModalFooter>
  </Modal>
{/if}
