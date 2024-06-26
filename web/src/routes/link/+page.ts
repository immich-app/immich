import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (({ url }) => {
  enum LinkTarget {
    HOME = 'home',
    UNSUBSCRIBE = 'unsubscribe',
    VIEW_ASSET = 'view_asset',
  }

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
  }

  return redirect(302, AppRoute.PHOTOS);
}) satisfies PageLoad;
