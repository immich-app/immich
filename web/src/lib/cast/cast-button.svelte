<script lang="ts">
  import { t } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { mdiCast, mdiCastConnected } from '@mdi/js';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { CastDestinationType, castManager } from '$lib/managers/cast-manager.svelte';
  import { GCastDestination } from '$lib/utils/cast/gcast-destination.svelte';
  import { IconButton } from '@immich/ui';

  interface Props {
    whiteHover?: boolean;
    navBar?: boolean;
  }

  let { whiteHover, navBar }: Props = $props();

  onMount(async () => {
    await castManager.initialize();
  });

  const getButtonColor = () => {
    return castManager.isCasting ? 'primary' : whiteHover ? undefined : 'opaque';
  };
</script>

{#if castManager.availableDestinations.length > 0 && castManager.availableDestinations[0].type === CastDestinationType.GCAST}
  {#if navBar}
    <IconButton
      shape="round"
      variant="ghost"
      size="medium"
      color={castManager.isCasting ? 'primary' : 'secondary'}
      icon={castManager.isCasting ? mdiCastConnected : mdiCast}
      onclick={() => void GCastDestination.showCastDialog()}
      aria-label={$t('cast')}
    />
  {:else}
    <CircleIconButton
      color={getButtonColor()}
      icon={castManager.isCasting ? mdiCastConnected : mdiCast}
      onclick={GCastDestination.showCastDialog}
      title={$t('cast')}
    />
  {/if}
{/if}
