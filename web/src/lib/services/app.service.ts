import { toastManager, type ActionItem } from '@immich/ui';
import { mdiCast, mdiCastConnected } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { CastDestinationType, castManager } from '$lib/managers/cast-manager.svelte';
import { GCastDestination } from '$lib/utils/cast/gcast-destination.svelte';
import { handleError } from '$lib/utils/handle-error';

export const getGlobalActions = ($t: MessageFormatter) => {
  const Cast: ActionItem = {
    title: $t(castManager.isCasting ? 'stop_casting' : 'cast'),
    icon: castManager.isCasting ? mdiCastConnected : mdiCast,
    color: castManager.isCasting ? 'primary' : 'secondary',
    $if: () =>
      castManager.availableDestinations.length > 0 &&
      castManager.availableDestinations[0].type === CastDestinationType.GCAST,
    onAction: () => {
      if (castManager.isCasting) {
        castManager.disconnect();
        return;
      }
      void GCastDestination.showCastDialog().catch((error: unknown) => {
        const code = typeof error === 'string' ? error : (error as { code?: string } | null)?.code;
        if (
          code === chrome.cast.ErrorCode.RECEIVER_UNAVAILABLE ||
          (code === chrome.cast.ErrorCode.SESSION_ERROR &&
            cast.framework.CastContext.getInstance().getCastState() === cast.framework.CastState.NO_DEVICES_AVAILABLE)
        ) {
          toastManager.danger($t('no_cast_devices_found'));
          return;
        }
        handleError(error, $t('errors.unable_to_connect'));
      });
    },
  };

  return { Cast };
};
