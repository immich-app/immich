<script lang="ts">
  import { t } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { mdiCast, mdiCastConnected } from '@mdi/js';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { CastDestinationType, castManager } from '$lib/managers/cast-manager.svelte';
  import { GCastDestination } from '$lib/utils/cast/gcast-destination.svelte';

  interface Props {
    isWhiteHover?: boolean;
  }

  let { isWhiteHover }: Props = $props();

  onMount(async () => {
    await castManager.initialize();
  });

  const getButtonColor = () => {
    return castManager.isCasting ? 'primary' : isWhiteHover ? undefined : 'opaque';
  };
</script>

{#if castManager.availableDestinations.length > 0 && castManager.availableDestinations[0].type === CastDestinationType.GCAST}
  <CircleIconButton
    color={getButtonColor()}
    icon={castManager.isCasting ? mdiCastConnected : mdiCast}
    onclick={GCastDestination.showCastDialog}
    title={$t('cast')}
  />
{/if}
