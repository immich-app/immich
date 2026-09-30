<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import PeopleSelectionModal from '$lib/modals/PeopleSelectionModal.svelte';
  import { handleBulkUpsert } from '$lib/services/person-user.service';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllPeople, type PersonResponseDto, type UserResponseDto } from '@immich/sdk';
  import {
    ActionButton,
    Field,
    FormModal,
    LoadingSpinner,
    modalManager,
    Select,
    Switch,
    Text,
    type ActionItem,
  } from '@immich/ui';
  import { mdiAccountMultipleOutline, mdiPencilOutline } from '@mdi/js';
  import { untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';

  type Props = {
    users: UserResponseDto[];
    people?: PersonResponseDto[];
    onClose: (saved?: boolean) => void;
  };

  let { users, people, onClose }: Props = $props();

  const user = $derived(users.find(({ id }) => id === selectedUserId) ?? users[0]);
  const userOptions = users.map(({ id, name }) => ({ label: name, value: id }));

  let selectedUserId = $state(users[0].id);
  let shareEveryone = $state(false);
  let serverPeople = $state<PersonResponseDto[]>([]);
  const added = new SvelteMap<string, PersonResponseDto>();
  const removed = new SvelteSet<string>();

  const selectedPeople = $derived([...serverPeople.filter(({ id }) => !removed.has(id)), ...added.values()]);
  const selectedIds = $derived(new Set(selectedPeople.map(({ id }) => id)));

  const canSubmit = $derived(shareEveryone || selectedIds.size > 0 || serverPeople.length > 0);

  const ManagePeople: ActionItem = $derived({
    title: $t('edit_people'),
    icon: mdiPencilOutline,
    onAction: () => handleEditPeople(),
  });

  const loadSharedPeople = async (sharedWithId: string) => {
    if (people) {
      return people.filter(({ sharedWith }) => sharedWith.some(({ id }) => id === sharedWithId));
    }

    const sharedPeople: PersonResponseDto[] = [];

    for (let page = 1, hasNextPage = true; hasNextPage; page++) {
      const result = await getAllPeople({
        sharedById: authManager.user.id,
        sharedWithId,
        withHidden: true,
        page,
        size: 1000,
      });

      sharedPeople.push(...result.people);
      hasNextPage = result.hasNextPage ?? false;
    }

    return sharedPeople;
  };

  const loadShares = async (sharedWithId: string) => {
    added.clear();
    removed.clear();

    try {
      serverPeople = await loadSharedPeople(sharedWithId);
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }

    try {
      const sharedIds = new Set(serverPeople.map(({ id }) => id));
      const allPeople = await loadAllPeople();
      const visiblePeople = allPeople.filter(({ isHidden }) => !isHidden);
      shareEveryone = sharedIds.size > 0 && visiblePeople.every(({ id }) => sharedIds.has(id));
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }
  };

  const handleSelectUser = async (id: string) => {
    selectedUserId = id;
    await loadShares(id);
  };

  const loadAllPeople = async () => {
    if (people) {
      return people;
    }

    const allPeople: PersonResponseDto[] = [];

    for (let page = 1, hasNextPage = true; hasNextPage; page++) {
      const result = await getAllPeople({ withHidden: false, page, size: 1000 });
      allPeople.push(...result.people);
      hasNextPage = result.hasNextPage ?? false;
    }

    return allPeople;
  };

  const handleEditPeople = async () => {
    let allPeople: PersonResponseDto[];

    try {
      allPeople = await loadAllPeople();
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
      return;
    }

    const updatedPeople = await modalManager.show(PeopleSelectionModal, {
      people: allPeople.filter(({ isHidden }) => !isHidden),
      selectedPeople,
    });

    if (!updatedPeople) {
      return;
    }

    const updatedIds = new Set(updatedPeople.map(({ id }) => id));

    for (const id of selectedIds) {
      if (updatedIds.has(id)) {
        continue;
      }
      if (added.has(id)) {
        added.delete(id);
      } else {
        removed.add(id);
        shareEveryone = false;
      }
    }

    for (const person of updatedPeople ?? []) {
      if (!selectedIds.has(person.id)) {
        added.set(person.id, person);
      }
    }
  };

  const onSubmit = async () => {
    const success = await handleBulkUpsert({
      sharedWithIds: [selectedUserId],
      everyone: shareEveryone,
      personIds: [...added.keys()],
      removedIds: [...removed],
    });

    if (success) {
      onClose(true);
    }
  };
</script>

<FormModal
  title={$t('manage_person_access')}
  submitText={$t('save')}
  icon={mdiAccountMultipleOutline}
  size="small"
  disabled={!canSubmit}
  {onSubmit}
  onClose={() => onClose()}
>
  <div class="flex flex-col gap-4">
    <Text size="small" color="muted">{$t('manage_people_access_description')}</Text>

    {#if users.length > 1}
      <Field label={$t('share_with')}>
        <Select value={selectedUserId} options={userOptions} onChange={handleSelectUser} />
      </Field>
    {:else}
      <div class="flex items-center gap-4">
        <UserAvatar {user} size="md" />
        <div class="text-start">
          <Text fontWeight="medium">{user.name}</Text>
          <Text size="tiny" color="muted">{user.email}</Text>
        </div>
      </div>
    {/if}

    {#await untrack(() => loadShares(selectedUserId))}
      <div class="flex w-full place-content-center place-items-center">
        <LoadingSpinner />
      </div>
    {:then}
      <Field
        label={$t('share_everyone')}
        description={$t('share_everyone_description', { values: { user: user.name } })}
      >
        <Switch bind:checked={shareEveryone} />
      </Field>

      {#if !shareEveryone}
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Text size="small" fontWeight="medium">
              {$t('shared_with_count', { values: { count: selectedPeople.length } })}
            </Text>
            <ActionButton type="button" color="primary" variant="ghost" action={ManagePeople} />
          </div>

          <div class="immich-scrollbar overflow-y-auto sm:max-h-64">
            {#each selectedPeople as person (person.id)}
              <div class="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-subtle">
                <ImageThumbnail circle url={getPeopleThumbnailUrl(person)} altText={person.name} widthStyle="2.5rem" />
                <Text size="small" class="grow truncate">{person.name}</Text>
              </div>
            {:else}
              <Text size="small" color="muted" class="p-2">{$t('no_people_found')}</Text>
            {/each}
          </div>
        </div>
      {/if}
    {/await}
  </div>
</FormModal>
