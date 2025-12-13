import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

enum LinkTarget {
  HOME = 'home',
  UNSUBSCRIBE = 'unsubscribe',
  VIEW_ASSET = 'view_asset',
  ACTIVATE_LICENSE = 'activate_license',
}

export const load = (({ url }) => {
  const queryParams = url.searchParams;
  const target = queryParams.get('target') as LinkTarget;
  switch (target) {
    case LinkTarget.HOME: {
      return redirect(302, AppRoute.PHOTOS);
    }

    case LinkTarget.UNSUBSCRIBE: {
      return redirect(302, `${AppRoute.USER_SETTINGS}?isOpen=notifications`);
    }

    case LinkTarget.VIEW_ASSET: {
      const id = queryParams.get('id');
      if (id) {
        return redirect(302, `${AppRoute.PHOTOS}/${id}`);
      }
      break;
    }

    case LinkTarget.ACTIVATE_LICENSE: {
      // https://my.immich.app/link?target=activate_license&licenseKey=IMCL-9XC3-T4S3-37BU-GGJ5-8MWP-F2Y1-BGEX-AQTF
      const licenseKey = queryParams.get('licenseKey');
      const activationKey = queryParams.get('activationKey');
      const redirectUrl = new URL(AppRoute.BUY, url.origin);

      if (licenseKey) {
        redirectUrl.searchParams.append('licenseKey', licenseKey);

        if (activationKey) {
          redirectUrl.searchParams.append('activationKey', activationKey);
        }

        return redirect(302, redirectUrl);
      }

      break;
    }
  }

  return redirect(302, AppRoute.PHOTOS);
}) satisfies PageLoad;
