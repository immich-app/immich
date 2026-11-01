import PinCodeUnlockModal from '#lib/modals/PinCodeUnlockModal.svelte';
import { fetchAuthStatus } from '#lib/queries/auth.query.ts';
import { modalManager } from '@immich/ui';

export const ensurePrivateSession = async () => {
  const status = await fetchAuthStatus();
  return status.isElevated || (await modalManager.show(PinCodeUnlockModal, {})) === true;
};
