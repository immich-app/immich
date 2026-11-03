import { getSharedLink as getCachedSharedLink, setSharedLink } from '#lib/utils.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { getAssetInfoFromParam } from '#lib/utils/navigation.ts';
import { getMySharedLink, isHttpError } from '@immich/sdk';

export const asQueryString = ({ slug, key }: { slug?: string; key?: string }) => {
  const params = new URLSearchParams();
  if (slug) {
    params.set('slug', slug);
  }

  if (key) {
    params.set('key', key);
  }

  return params.toString();
};

export const loadSharedLink = async ({
  url,
  params,
}: {
  url: URL;
  params: { key?: string; slug?: string; assetId?: string };
}) => {
  const { key, slug } = params;
  await authenticate(url, { public: true });

  const common = { key, slug };
  const $t = await getFormatter();

  const cachedSharedLink = getCachedSharedLink();
  const sharedLinkPromise =
    cachedSharedLink && (key === cachedSharedLink.key || slug === cachedSharedLink.slug)
      ? Promise.resolve(cachedSharedLink)
      : getMySharedLink({ key, slug });

  try {
    const [sharedLink, asset] = await Promise.all([sharedLinkPromise, getAssetInfoFromParam(params)]);
    setSharedLink(sharedLink);

    return {
      ...common,
      sharedLink,
      asset,
      meta: {
        title: sharedLink.album ? sharedLink.album.albumName : $t('public_share'),
      },
    };
  } catch (error) {
    if (isHttpError(error) && error.data.message === 'Password required') {
      return {
        ...common,
        passwordRequired: true,
        meta: {
          title: $t('password_required'),
        },
      };
    }

    throw error;
  }
};
