import { getConfig, updateConfig } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import { OpenQueryParam } from '$lib/constants';
import { Route } from '$lib/route';
import type { PageLoad } from './$types';

enum LinkTarget {
  HOME = 'home',
  UNSUBSCRIBE = 'unsubscribe',
  VIEW_ASSET = 'view_asset',
  ACTIVATE_LICENSE = 'activate_license',
  BACKUPS = 'backups',
}

export const load = (async ({ url }) => {
  const queryParams = url.searchParams;
  const target = queryParams.get('target') as LinkTarget;
  switch (target) {
    case LinkTarget.HOME: {
      return redirect(307, Route.photos());
    }

    case LinkTarget.UNSUBSCRIBE: {
      return redirect(307, Route.userSettings({ isOpen: OpenQueryParam.NOTIFICATIONS }));
    }

    case LinkTarget.BACKUPS: {
      const config = await getConfig().catch(() => undefined);
      if (config && !config.backup.beta) {
        await updateConfig({
          systemConfigDto: { ...config, backup: { ...config.backup, beta: true } },
        }).catch(() => undefined);
      }

      return redirect(307, Route.backups());
    }

    case LinkTarget.VIEW_ASSET: {
      const id = queryParams.get('id');
      if (id) {
        return redirect(307, Route.viewAsset({ id }));
      }
      break;
    }

    case LinkTarget.ACTIVATE_LICENSE: {
      // https://my.immich.app/link?target=activate_license&licenseKey=IMCL-9XC3-T4S3-37BU-GGJ5-8MWP-F2Y1-BGEX-AQTF
      const licenseKey = queryParams.get('licenseKey');
      const activationKey = queryParams.get('activationKey');
      const redirectUrl = new URL(Route.buy(), url.origin);

      if (licenseKey) {
        redirectUrl.searchParams.append('licenseKey', licenseKey);

        if (activationKey) {
          redirectUrl.searchParams.append('activationKey', activationKey);
        }

        return redirect(307, redirectUrl);
      }

      break;
    }
  }

  return redirect(307, Route.photos());
}) satisfies PageLoad;
