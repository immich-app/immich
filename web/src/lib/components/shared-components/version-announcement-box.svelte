<script lang="ts">
  import { websocketStore } from '$lib/stores/websocket';
  import type { ServerVersionResponseDto } from '@immich/sdk';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from './full-screen-modal.svelte';

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
  <FullScreenModal title="🎉 NEW VERSION AVAILABLE" onClose={() => (showModal = false)}>
    <div>
      Hi friend, there is a new version of the application please take your time to visit the
      <span class="font-medium underline"
        ><a href="https://github.com/immich-app/immich/releases/latest" target="_blank" rel="noopener noreferrer"
          >release notes</a
        ></span
      >
      and ensure your <code>docker-compose</code>, and <code>.env</code> setup is up-to-date to prevent any misconfigurations,
      especially if you use WatchTower or any mechanism that handles updating your application automatically.
    </div>

    <div class="mt-4 font-medium">Your friend, Alex</div>

    <div class="font-sm mt-8">
      <code>Server Version: {serverVersion}</code>
      <br />
      <code>Latest Version: {releaseVersion}</code>
    </div>

    <svelte:fragment slot="sticky-bottom">
      <Button fullwidth on:click={onAcknowledge}>Acknowledge</Button>
    </svelte:fragment>
  </FullScreenModal>
{/if}
