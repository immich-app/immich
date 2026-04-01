import { CastDestinationType, castManager } from '$lib/managers/cast-manager.svelte';
import { GCastDestination } from '$lib/utils/cast/gcast-destination.svelte';
import type { ActionItem } from '@immich/ui';
import { mdiCast, mdiCastConnected } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getGlobalActions = ($t: MessageFormatter) => {
  const Cast: ActionItem = {
    title: $t('cast'),
    icon: castManager.isCasting ? mdiCastConnected : mdiCast,
    color: castManager.isCasting ? 'primary' : 'secondary',
    $if: () =>
      castManager.availableDestinations.length > 0 &&
      castManager.availableDestinations[0].type === CastDestinationType.GCAST,
    onAction: () => void GCastDestination.showCastDialog(),
  };

  return { Cast };
};
