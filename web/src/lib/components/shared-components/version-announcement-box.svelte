<script lang="ts">
  import { websocketStore } from '$lib/stores/websocket';
  import type { ServerVersionResponseDto } from '@immich/sdk';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from './full-screen-modal.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

  let showModal = $state(false);

  const { release } = websocketStore;

  const semverToName = ({ major, minor, patch }: ServerVersionResponseDto) => `v${major}.${minor}.${patch}`;

  const onAcknowledge = () => {
    localStorage.setItem('appVersion', releaseVersion);
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
    if ($release?.isAvailable) {
      handleRelease();
    }
  });
</script>

{#if showModal}
  <FullScreenModal title="🎉 {$t('new_version_available')}" onClose={() => (showModal = false)}>
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

    {#snippet stickyBottom()}
      <Button fullwidth onclick={onAcknowledge}>{$t('acknowledge')}</Button>
    {/snippet}
  </FullScreenModal>
{/if}
