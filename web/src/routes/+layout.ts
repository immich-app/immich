import { checkAppVersion } from '$lib/utils/check-app-version';
import { LayoutLoad } from '.svelte-kit/types/src/routes/$types';

export const load: LayoutLoad = async ({ url }) => {
	return { url };
};
