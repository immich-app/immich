import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export interface StatisticsResponse {
  monthly: Array<{ year: number; month: number; count: number }>;
  temporalMatrix: Array<{ dayOfWeek: number; hour: number; count: number }>;
  topPeople: Array<{
    id: string;
    name: string;
    birthDate: string | null;
    thumbnailPath: string;
    isHidden: boolean;
    updatedAt?: string;
    isFavorite?: boolean;
    color?: string;
    count: number;
  }>;
  topCameras: Array<{ make: string | null; model: string | null; count: number }>;
  topLenses: Array<{ lensModel: string | null; count: number }>;
  topCities: Array<{ city: string | null; count: number }>;
  topCountries: Array<{ country: string | null; count: number }>;
  storage: Array<{ type: 'IMAGE' | 'VIDEO'; size: number; count: number }>;
  total: { photos: number; videos: number; storage: number };
}

export const load = (async ({ url, fetch }) => {
  await authenticate(url);

  const response = await fetch('/api/users/me/statistics');

  if (!response.ok) {
    throw new Error(`Failed to load statistics: ${response.status} ${response.statusText}`);
  }

  const statistics = (await response.json()) as StatisticsResponse;
  const $t = await getFormatter();

  return {
    statistics,
    meta: {
      title: $t('statistics'),
    },
  };
}) satisfies PageLoad;
