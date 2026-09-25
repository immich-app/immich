<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import PeopleFilterUserPicker from '$lib/modals/PeopleFilterUserPicker.svelte';
  import type { PeopleFilter } from '$lib/types';
  import { handleError } from '$lib/utils/handle-error';
  import { getClusterGroupUsers, type UserResponseDto } from '@immich/sdk';
  import { Button, Checkbox, FormModal, Label, modalManager, Stack, Text } from '@immich/ui';
  import { mdiClose, mdiTune } from '@mdi/js';
  import { onMount, untrack } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    filter: PeopleFilter;
    onClose: (filter?: PeopleFilter) => void;
  };

  let { filter, onClose }: Props = $props();

  let sharedById = $state(untrack(() => filter.sharedById ?? ''));
  let sharedWithId = $state(untrack(() => filter.sharedWithId ?? ''));
  let isFavorite = $state(untrack(() => filter.isFavorite));
  let isHidden = $state(untrack(() => filter.isHidden));
  let users = $state<UserResponseDto[]>([]);

  const cycle = (value?: boolean) => (value === undefined ? true : value ? false : undefined);

  onMount(async () => {
    try {
      const clusterGroupUsers = await getClusterGroupUsers({ id: authManager.user.clusterGroupId });
      users = clusterGroupUsers.filter(({ id }) => id !== authManager.user.id);
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }
  });

  const getUser = (userId: string) => [authManager.user, ...users].find(({ id }) => id === userId);

  const getUserLabel = $derived((userId: string) => {
    if (!userId) {
      return $t('no_filter');
    }

    if (userId === authManager.user.id) {
      return $t('you');
    }

    return users.find(({ id }) => id === userId)?.name ?? userId;
  });

  const onPickSharedBy = async () => {
    const userId = await modalManager.show(PeopleFilterUserPicker, {
      title: $t('shared_by'),
      selected: sharedById,
      users,
    });
    if (userId !== undefined) {
      sharedById = userId;
    }
  };

  const onPickSharedWith = async () => {
    const userId = await modalManager.show(PeopleFilterUserPicker, {
      title: $t('shared_with'),
      selected: sharedWithId,
      users,
    });
    if (userId !== undefined) {
      sharedWithId = userId;
    }
  };

  const onSubmit = () => {
    onClose({ sharedById: sharedById || undefined, sharedWithId: sharedWithId || undefined, isFavorite, isHidden });
  };
</script>

{#snippet row(id: string, label: string, userId: string, onPick: () => Promise<void>)}
  {@const user = getUser(userId)}
  <div class="flex items-center justify-between gap-2">
    <Label id="{id}-label" for={id}>{label}</Label>
    <Button
      {id}
      aria-labelledby="{id}-label {id}"
      onclick={onPick}
      size="small"
      variant="outline"
      shape="round"
      color="secondary"
      trailingIcon={user ? mdiClose : undefined}
    >
      <div class="flex gap-2 text-start">
        {#if user}
          <div>
            <Text fontWeight="medium" size="small">{getUserLabel(userId)}</Text>
          </div>
        {:else}
          <Text fontWeight="medium">{getUserLabel(userId)}</Text>
        {/if}
      </div>
    </Button>
  </div>
{/snippet}

<FormModal title={$t('filters')} icon={mdiTune} {onClose} {onSubmit} size="small">
  <Stack gap={6}>
    {@render row('people-filter-shared-by', $t('shared_by'), sharedById, onPickSharedBy)}
    {@render row('people-filter-shared-with', $t('shared_with'), sharedWithId, onPickSharedWith)}
    <div class="flex items-center justify-between gap-2">
      <Label id="people-filter-favorite-label" for="people-filter-favorite">{$t('favorite')}</Label>
      <Checkbox
        id="people-filter-favorite"
        aria-labelledby="people-filter-favorite-label"
        bind:checked={() => isFavorite === true, () => (isFavorite = cycle(isFavorite))}
        indeterminate={isFavorite === undefined}
      />
    </div>
    <div class="flex items-center justify-between gap-2">
      <Label id="people-filter-hidden-label" for="people-filter-hidden">{$t('hidden')}</Label>
      <Checkbox
        id="people-filter-hidden"
        aria-labelledby="people-filter-hidden-label"
        bind:checked={() => isHidden === true, () => (isHidden = cycle(isHidden))}
        indeterminate={isHidden === undefined}
      />
    </div>
  </Stack>
</FormModal>
