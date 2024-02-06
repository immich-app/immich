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
      <p class="mb-4 text-2xl">🎉 Nouvelle version disponible 🎉</p>

      <div>
        Une nouvelle mise à jour de la 
        <span class="font-immich-title font-bold text-immich-primary dark:text-immich-dark-primary">Mémoire Vive</span>,
        prenez le temps de découvrir la  
        <span class="font-medium underline"
          ><a href="https://github.com/theophilefreger" target="_blank" rel="noopener noreferrer"
            >note de mise à jour</a
          ></span
        >
        et assurez-vous que votre configuration <code>docker-compose</code> et <code>.env</code> est à jour pour éviter toute mauvaise configuration,
        en particulier si vous utilisez WatchTower ou un mécanisme qui gère la mise à jour de votre application automatiquement.
      </div>

      <div class="mt-4 font-medium">Votre ami, Théophile</div>

      <div class="font-sm mt-8">
        <code>Version du serveur: {serverVersion}</code>
        <br />
        <code>Dernière version: {releaseVersion}</code>
      </div>

      <div class="mt-8 text-right">
        <Button fullwidth on:click={onAcknowledge}>Renseignements</Button>
      </div>
    </div>
  </FullScreenModal>
{/if}
