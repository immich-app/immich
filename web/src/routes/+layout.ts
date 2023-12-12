import { api } from '@api';
import type { LayoutLoad } from './$types';
import { getSavedUser, setUser } from '$lib/stores/user.store';

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
  const savedUser = getSavedUser();
  const user = savedUser || (await getUser());

  if (!savedUser) {
    setUser(user);
  }

  return {
    user,
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
