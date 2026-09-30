<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import PeopleSelectionModal from '$lib/modals/PeopleSelectionModal.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleBulkUpsert } from '$lib/services/person-user.service';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllPeople, PersonUserRole, type PersonResponseDto, type UserResponseDto } from '@immich/sdk';
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
  import { mdiAccountMultipleOutline, mdiClose, mdiPlus } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';

  type Props = {
    users: UserResponseDto[];
    people?: PersonResponseDto[];
    onClose: (saved?: boolean) => void;
  };

  let { users, people, onClose }: Props = $props();

  const multiple = users.length > 1;
  let selectedUserId = $state(users[0].id);
  const user = $derived(users.find(({ id }) => id === selectedUserId) ?? users[0]);
  const userOptions = users.map(({ id, name }) => ({ label: name, value: id }));

  let loading = $state(true);
  let saving = $state(false);
  let shareEveryone = $state(false);
  let role = $state<PersonUserRole>(PersonUserRole.Read);
  let serverPeople: PersonResponseDto[] = $state([]);
  const existingRoles = new SvelteMap<string, PersonUserRole>();
  const added = new SvelteMap<string, PersonResponseDto>();
  const removed = new SvelteSet<string>();

  const roleOptions = $derived([
    { label: $t('person_role_read'), value: PersonUserRole.Read },
    { label: $t('person_role_write'), value: PersonUserRole.Write },
    { label: $t('person_role_admin'), value: PersonUserRole.Admin },
  ]);

  const selectedPeople = $derived([...serverPeople.filter(({ id }) => !removed.has(id)), ...added.values()]);
  const selectedIds = $derived(new Set(selectedPeople.map(({ id }) => id)));
  const changedIds = $derived(
    [...existingRoles].filter(([id, existingRole]) => !removed.has(id) && existingRole !== role).map(([id]) => id),
  );
  const upsertIds = $derived([...changedIds, ...added.keys()]);

  const canSubmit = $derived(!loading && !saving && (shareEveryone || upsertIds.length > 0 || removed.size > 0));

  const AddPeople: ActionItem = $derived({
    title: $t('add_people'),
    icon: mdiPlus,
    onAction: () => handleAddPeople(),
  });

  const getRemoveAction = (person: PersonResponseDto): ActionItem => ({
    title: $t('remove'),
    icon: mdiClose,
    onAction: () => handleRemovePerson(person),
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
    loading = true;

    try {
      existingRoles.clear();
      added.clear();
      removed.clear();
      serverPeople = await loadSharedPeople(sharedWithId);

      for (const person of serverPeople) {
        const share = person.sharedWith.find(({ id }) => id === sharedWithId);
        if (share) {
          existingRoles.set(person.id, share.role);
        }
      }

      role = existingRoles.values().next().value ?? PersonUserRole.Read;
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    } finally {
      loading = false;
    }
  };

  const handleSelectUser = async (id: string) => {
    selectedUserId = id;
    await loadShares(id);
  };

  onMount(() => loadShares(selectedUserId));

  const loadAllPeople = async () => {
    if (people) {
      return people;
    }

    const result = await getAllPeople({ withHidden: false });
    return result.people;
  };

  const handleAddPeople = async () => {
    let allPeople: PersonResponseDto[] = [];

    try {
      allPeople = await loadAllPeople();
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
      return;
    }

    const picked = await modalManager.show(PeopleSelectionModal, {
      people: allPeople.filter(({ id, isHidden }) => !isHidden && !selectedIds.has(id)),
    });

    for (const person of picked ?? []) {
      if (removed.has(person.id)) {
        removed.delete(person.id);
      } else {
        added.set(person.id, person);
      }
    }
  };

  const handleRemovePerson = ({ id }: PersonResponseDto) => {
    if (added.has(id)) {
      added.delete(id);
    } else {
      removed.add(id);
    }
  };

  const onSubmit = async () => {
    saving = true;

    const success = await handleBulkUpsert({
      sharedWithIds: [selectedUserId],
      role,
      everyone: shareEveryone,
      personIds: upsertIds,
      removedIds: [...removed],
    });

    saving = false;

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

    {#if multiple}
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

    {#if loading}
      <div class="flex w-full place-content-center place-items-center">
        <LoadingSpinner />
      </div>
    {:else}
      <Field label={$t('role')}>
        <Select bind:value={role} options={roleOptions} />
      </Field>

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
              {$t('selected_with_count', { values: { count: selectedPeople.length } })}
            </Text>
            <ActionButton type="button" variant="outline" action={AddPeople} />
          </div>

          <div class="immich-scrollbar overflow-y-auto sm:max-h-64">
            {#each selectedPeople as person (person.id)}
              <div class="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-subtle">
                <ImageThumbnail circle url={getPeopleThumbnailUrl(person)} altText={person.name} widthStyle="2.5rem" />
                <Text size="small" class="grow truncate">{person.name}</Text>
                <ActionButton size="small" action={getRemoveAction(person)} />
              </div>
            {:else}
              <Text size="small" color="muted" class="p-2">{$t('no_people_found')}</Text>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</FormModal>
