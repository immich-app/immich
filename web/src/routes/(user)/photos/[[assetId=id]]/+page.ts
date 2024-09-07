import {
  AssetGridOptionsValues,
  createAssetGridOptionsFromArray,
  QueryParameter,
  type IQueryParameter,
} from '$lib/constants';
import { checkEnumInArray, parseNumberOrUndefined } from '$lib/utils';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam, isExternalUrl } from '$lib/utils/navigation';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate();
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();
  const options: IQueryParameter = {};

  const getPreviousRoute = url.searchParams.get(QueryParameter.PREVIOUS_ROUTE);
  if (getPreviousRoute && !isExternalUrl(decodeURIComponent(getPreviousRoute))) {
    options.previousRoute = decodeURIComponent(getPreviousRoute);
  }

  const assetGridOptionss = url.searchParams.get(QueryParameter.ASSET_GRID_OPTIONS)?.split(',');
  if (assetGridOptionss && checkEnumInArray(assetGridOptionss, AssetGridOptionsValues)) {
    options.assetGridOptions = createAssetGridOptionsFromArray(assetGridOptionss);
  }

  const x1 = parseNumberOrUndefined(url.searchParams.get(QueryParameter.COORDINATESX1));
  const x2 = parseNumberOrUndefined(url.searchParams.get(QueryParameter.COORDINATESX2));
  const y1 = parseNumberOrUndefined(url.searchParams.get(QueryParameter.COORDINATESY1));
  const y2 = parseNumberOrUndefined(url.searchParams.get(QueryParameter.COORDINATESY2));
  if (x1 && x2 && y1 && y2) {
    options.coordinates = {
      x1,
      x2,
      y1,
      y2,
    };
  }

  return {
    asset,
    meta: {
      title: $t('photos'),
    },
    options,
  };
}) satisfies PageLoad;
