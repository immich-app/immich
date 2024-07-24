<script lang="ts">
  import { websocketStore } from '$lib/stores/websocket';
  import type { ServerVersionResponseDto } from '@immich/sdk';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from './full-screen-modal.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

  let showModal = false;

  const { release } = websocketStore;

  const semverToName = ({ major, minor, patch }: ServerVersionResponseDto) => `v${major}.${minor}.${patch}`;

  $: releaseVersion = $release && semverToName($release.releaseVersion);
  $: serverVersion = $release && semverToName($release.serverVersion);
  $: $release?.isAvailable && handleRelease();

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
</script>

{#if showModal}
  <FullScreenModal title="🎉 {$t('new_version_available')}" onClose={() => (showModal = false)}>
    <div>
      <FormatMessage key="version_announcement_message" let:tag let:message>
        {#if tag === 'link'}
          <span class="font-medium underline">
            <a href="https://github.com/immich-app/immich/releases/latest" target="_blank" rel="noopener noreferrer">
              {message}
            </a>
          </span>
        {:else if tag === 'code'}
          <code>{message}</code>
        {/if}
      </FormatMessage>
    </div>

    <div class="mt-4 font-medium">{$t('version_announcement_closing')}</div>

    <div class="font-sm mt-8">
      <code>{$t('server_version')}: {serverVersion}</code>
      <br />
      <code>{$t('latest_version')}: {releaseVersion}</code>
    </div>

    <svelte:fragment slot="sticky-bottom">
      <Button fullwidth on:click={onAcknowledge}>{$t('acknowledge')}</Button>
    </svelte:fragment>
  </FullScreenModal>
{/if}
