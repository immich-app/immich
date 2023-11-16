import { api } from '../api';
import type { LayoutLoad } from './$types';

const getUser = async () => {
  try {
    const { data: user } = await api.userApi.getMyUserInfo();
    return user;
  } catch {
    return null;
  }
};

export const ssr = false;
export const csr = true;

export const load = (async () => {
  const user = await getUser();

  return {
    user,
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
