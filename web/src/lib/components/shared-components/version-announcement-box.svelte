<script lang="ts">
  import type { ServerVersionResponseDto } from '@api';
  import { websocketStore } from '$lib/stores/websocket';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from './full-screen-modal.svelte';

  let showModal = false;

  const { onRelease } = websocketStore;

  const semverToName = ({ major, minor, patch }: ServerVersionResponseDto) => `v${major}.${minor}.${patch}`;

  $: releaseVersion = $onRelease && semverToName($onRelease.releaseVersion);
  $: serverVersion = $onRelease && semverToName($onRelease.serverVersion);
  $: $onRelease?.isAvailable && handleRelease();

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
  <FullScreenModal on:clickOutside={() => (showModal = false)}>
    <div
      class="max-w-lg rounded-3xl border bg-immich-bg px-8 py-10 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
    >
      <p class="mb-4 text-2xl">🎉 NEW VERSION AVAILABLE 🎉</p>

      <div>
        Hi friend, there is a new release of
        <span class="font-immich-title font-bold text-immich-primary dark:text-immich-dark-primary">IMMICH</span>,
        please take your time to visit the
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

      <div class="mt-8 text-right">
        <Button fullwidth on:click={onAcknowledge}>Acknowledge</Button>
      </div>
    </div>
  </FullScreenModal>
{/if}
