import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import { Route } from '$lib/route';
import { getFormatter } from '$lib/utils/i18n';
import { validateInvitation } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const $t = await getFormatter();

  // Check if family mode is enabled
  if (!featureFlagsManager.value.familyMode) {
    redirect(307, Route.login());
  }

  // Validate the invitation token
  const invitation = await validateInvitation({ token: params.token });

  if (!invitation) {
    return {
      meta: {
        title: $t('invitation_invalid'),
      },
      invitation: null,
      token: params.token,
      error: 'invalid',
    };
  }

  // Check if already accepted
  if (invitation.acceptedAt) {
    return {
      meta: {
        title: $t('invitation_already_accepted'),
      },
      invitation,
      token: params.token,
      error: 'already_accepted',
    };
  }

  // Check if expired
  if (new Date(invitation.expiresAt) < new Date()) {
    return {
      meta: {
        title: $t('invitation_expired'),
      },
      invitation,
      token: params.token,
      error: 'expired',
    };
  }

  return {
    meta: {
      title: $t('accept_invitation'),
    },
    invitation,
    token: params.token,
    error: null,
  };
}) satisfies PageLoad;
