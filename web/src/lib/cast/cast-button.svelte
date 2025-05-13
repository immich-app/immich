<script lang="ts">
  import { t } from 'svelte-i18n';
  import GCastPlayer, { loadCastFramework } from '$lib/utils/cast/gcast-player';
  import { onMount } from 'svelte';
  import { mdiCast } from '@mdi/js';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { IconButton } from '@immich/ui';

  onMount(() => {
    // Check if the GCastPlayer instance is already created
    if (GCastPlayer.instanceCreated()) {
      // If it is, we can use it directly
      castPlayer = GCastPlayer.getInstance();
    } else {
      // Otherwise, Load the Cast framework
      loadCastFramework();

      window['__onGCastApiAvailable'] = function (isAvailable) {
        console.log('GCast API available:', isAvailable);
        // The cast sender can't be initialized until the API is available
        if (isAvailable) {
          castPlayer = GCastPlayer.getInstance();
          castPlayer.isAvailable.set(true);
        }
      };
    }
  });

  interface Props {
    isNavBar?: boolean;
  }

  let { isNavBar }: Props = $props();
  let castPlayer: GCastPlayer | undefined = $state();
</script>

{#if castPlayer?.isAvailable}
  {#if isNavBar}
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      size="medium"
      icon={mdiCast}
      onclick={() => void castPlayer?.showCastDialog()}
      aria-label={$t('cast')}
    />
  {:else}
    <CircleIconButton
      color="opaque"
      icon={mdiCast}
      onclick={() => void castPlayer?.showCastDialog()}
      title={$t('cast')}
    />
  {/if}
{/if}
