import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals: { api, user } }) => {
  const { data: serverVersion } = await api.serverInfoApi.getServerVersion();

  return { serverVersion, user };
}) satisfies LayoutServerLoad;
