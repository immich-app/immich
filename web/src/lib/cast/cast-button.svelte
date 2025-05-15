<script lang="ts">
  import { t } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { mdiCast, mdiCastConnected } from '@mdi/js';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { IconButton } from '@immich/ui';
  import { CastDestinationType, castManager } from '$lib/managers/cast-manager.svelte';
  import { GCastDestination } from '$lib/utils/cast/gcast-destination.svelte';

  interface Props {
    isNavBar?: boolean;
  }

  let { isNavBar }: Props = $props();

  onMount(() => {
    void castManager.initialize();
  });
</script>

{#if castManager.availableDestinations.length > 0 && castManager.availableDestinations[0].type == CastDestinationType.GCAST}
  {#if isNavBar}
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
      color={castManager.isCasting ? 'primary' : 'opaque'}
      icon={castManager.isCasting ? mdiCastConnected : mdiCast}
      onclick={() => void GCastDestination.showCastDialog()}
      title={$t('cast')}
    />
  {/if}
{/if}
