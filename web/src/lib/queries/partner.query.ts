import { asMutation, queryClient } from '#lib/queries/client.ts';
import { PartnerDirection, createPartner, getPartners, removePartner, updatePartner } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const partnersQueryKey = ['partners'];

export const getPartnersQuery = (direction: PartnerDirection) =>
  queryOptions({
    queryKey: [...partnersQueryKey, direction],
    queryFn: ({ signal }) => getPartners({ direction }, { signal }),
  });

const invalidatePartners = () => queryClient.invalidateQueries({ queryKey: partnersQueryKey });

export const createPartnerMutation = () =>
  asMutation(createPartner, {
    onSuccess: invalidatePartners,
    meta: { error: { toast: 'errors.unable_to_add_partners' } },
  });

export const removePartnerMutation = () =>
  asMutation(removePartner, {
    onSuccess: invalidatePartners,
    meta: { error: { toast: 'errors.unable_to_remove_partner' } },
  });

export const updatePartnerMutation = () =>
  asMutation(updatePartner, {
    onSuccess: invalidatePartners,
    meta: { error: { toast: 'errors.unable_to_update_timeline_display_status' } },
  });
