<script lang="ts">
  import { t } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { mdiCast, mdiCastConnected } from '@mdi/js';
  import { CastDestinationType, castManager } from '$lib/managers/cast-manager.svelte';
  import { GCastDestination } from '$lib/utils/cast/gcast-destination.svelte';
  import { IconButton } from '@immich/ui';

  onMount(async () => {
    await castManager.initialize();
  });
</script>

{#if castManager.availableDestinations.length > 0 && castManager.availableDestinations[0].type === CastDestinationType.GCAST}
  <IconButton
    shape="round"
    variant="ghost"
    size="medium"
    color={castManager.isCasting ? 'primary' : 'secondary'}
    icon={castManager.isCasting ? mdiCastConnected : mdiCast}
    onclick={() => void GCastDestination.showCastDialog()}
    aria-label={$t('cast')}
  />
{/if}
