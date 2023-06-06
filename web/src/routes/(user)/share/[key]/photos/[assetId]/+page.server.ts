import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals: { api } }) => {
	const { key, assetId } = params;
	const { data: asset } = await api.assetApi.getAssetById({ id: assetId, key });

	if (!asset) {
		throw error(404, 'Asset not found');
	}

	return {
		asset,
		key,
		meta: {
			title: 'Public Share'
		}
	};
}) satisfies PageServerLoad;
