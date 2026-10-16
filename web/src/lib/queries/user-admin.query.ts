import { searchUsersAdmin } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const searchUsersAdminQuery = () =>
  queryOptions({
    queryKey: ['user-admin'],
    queryFn: ({ signal }) => searchUsersAdmin({ withDeleted: true }, { signal }),
  });

export const getUserAdminQuery = (id: string) =>
  queryOptions({
    ...searchUsersAdminQuery(),
    select: (users) => {
      const user = users.find((user) => user.id === id);
      if (!user) {
        throw new Error(`User ${id} not found`);
      }
      return user;
    },
  });
