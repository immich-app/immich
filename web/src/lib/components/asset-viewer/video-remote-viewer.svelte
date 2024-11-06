<script lang="ts">
  import CastPlayer from '$lib/utils/cast-player';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';

  let castPlayer = CastPlayer.getInstance();
  let remotePlayer = get(castPlayer.remotePlayer);
  let castState = get(castPlayer.castState);

  let receiverFriendlyName = get(castPlayer.receiverFriendlyName);

  export let poster: string;

  const handlePlay = () => {
    castPlayer.play();
  };

  const handlePause = () => {
    castPlayer.pause();
  };

  function handleSeek(event: Event) {
    const newTime: number = Number.parseFloat((event.target as HTMLInputElement).value);
    castPlayer.seek(newTime);
  }

  onMount(() => {
    castPlayer.isConnected.subscribe((value) => {
      remotePlayer.isConnected = value;
    });

    receiverFriendlyName = get(castPlayer.receiverFriendlyName);
    castPlayer.receiverFriendlyName.subscribe((value) => {
      receiverFriendlyName = value;
    });

    castPlayer.remotePlayer.subscribe((value) => {
      remotePlayer = value;
    });

    castPlayer.mediaInfo.subscribe((value) => {
      remotePlayer.mediaInfo = value;
    });

    castPlayer.currentTime.subscribe((value) => {
      if (value) {
        remotePlayer.currentTime = value;
      }
    });

    castPlayer.duration.subscribe((value) => {
      if (value && remotePlayer.mediaInfo) {
        remotePlayer.mediaInfo.duration = value;
      }
    });

    castPlayer.playerState.subscribe((value) => {
      remotePlayer.playerState = value;
    });

    castPlayer.castState.subscribe((value) => {
      castState = value;
    });
  });
</script>

<img src={poster} alt="poster" />
<div class="absolute flex place-content-center place-items-center">
  {#if castState === 'CONNECTED'}
    Connected to {receiverFriendlyName}
  {/if}
  {remotePlayer.playerState}
</div>
{#if remotePlayer.playerState === 'BUFFERING'}
  <LoadingSpinner />
{/if}
<Button on:click={handlePlay}>Play</Button>
<Button on:click={handlePause}>Pause</Button>

{#if remotePlayer.currentTime}
  <input
    type="range"
    min="0"
    max={remotePlayer.mediaInfo?.duration}
    value={remotePlayer.currentTime}
    on:change={handleSeek}
  />
{/if}
