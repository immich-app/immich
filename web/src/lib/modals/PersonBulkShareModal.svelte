<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import PeopleSelectionModal from '$lib/modals/PeopleSelectionModal.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    addUsersToPeople,
    getAllPeople,
    getUsersForPeople,
    PersonUserRole,
    removeUsersFromPeople,
    type PersonResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import {
    Button,
    Field,
    FormModal,
    IconButton,
    LoadingSpinner,
    modalManager,
    Select,
    Switch,
    Text,
    toastManager,
  } from '@immich/ui';
  import { mdiCheck, mdiClose, mdiPlus } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';

  type Props = {
    user: UserResponseDto;
    onClose: (saved?: boolean) => void;
  };

  let { user, onClose }: Props = $props();

  let loading = $state(true);
  let saving = $state(false);
  let shareEveryone = $state(false);
  let role = $state<PersonUserRole>(PersonUserRole.Read);
  let people: PersonResponseDto[] = $state([]);
  const existingRoles = new SvelteMap<string, PersonUserRole>();
  const selectedIds = new SvelteSet<string>();

  const roleOptions = $derived([
    { label: $t('person_role_read'), value: PersonUserRole.Read },
    { label: $t('person_role_write'), value: PersonUserRole.Write },
    { label: $t('person_role_admin'), value: PersonUserRole.Admin },
  ]);

  const selectedPeople = $derived(people.filter(({ id }) => selectedIds.has(id)));
  const availablePeople = $derived(people.filter(({ id }) => !selectedIds.has(id)));

  const canSubmit = $derived(!loading && !saving && (shareEveryone || selectedIds.size > 0 || existingRoles.size > 0));

  onMount(async () => {
    try {
      const [shares, { people: allPeople }] = await Promise.all([
        getUsersForPeople({ sharedById: authManager.user.id, sharedWithId: user.id }),
        getAllPeople({ withHidden: false }),
      ]);

      people = allPeople;

      for (const share of shares) {
        existingRoles.set(share.personId, share.role);
        selectedIds.add(share.personId);
      }

      role = shares[0]?.role ?? PersonUserRole.Read;
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    } finally {
      loading = false;
    }
  });

  const handleAddPeople = async () => {
    const added = await modalManager.show(PeopleSelectionModal, { people: availablePeople });

    for (const { id } of added ?? []) {
      selectedIds.add(id);
    }
  };

  const onSubmit = async () => {
    saving = true;

    try {
      if (shareEveryone) {
        await addUsersToPeople({ personUsersCreateDto: { sharedWithIds: [user.id], role } });
      } else {
        const personIds = [...selectedIds].filter((id) => existingRoles.get(id) !== role);
        const removed = [...existingRoles.keys()].filter((id) => !selectedIds.has(id));

        if (personIds.length > 0) {
          await addUsersToPeople({ personUsersCreateDto: { personIds, sharedWithIds: [user.id], role } });
        }

        if (removed.length > 0) {
          await removeUsersFromPeople({
            personUsersDeleteDto: removed.map((personId) => ({ personId, sharedWithId: user.id })),
          });
        }
      }

      toastManager.primary({ icon: mdiCheck, title: $t('saved') });
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    } finally {
      saving = false;
    }
  };
</script>

<FormModal
  title={$t('share_people_with_user', { values: { user: user.name } })}
  submitText={$t('save')}
  size="small"
  disabled={!canSubmit}
  {onSubmit}
  onClose={() => onClose()}
>
  {#if loading}
    <div class="flex w-full place-content-center place-items-center">
      <LoadingSpinner />
    </div>
  {:else}
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-4">
        <UserAvatar {user} size="md" />
        <div class="text-start">
          <Text fontWeight="medium">{user.name}</Text>
          <Text size="tiny" color="muted">{user.email}</Text>
        </div>
      </div>

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
              {$t('selected_with_count', { values: { count: selectedIds.size } })}
            </Text>
            <Button
              shape="semi-round"
              size="small"
              color="secondary"
              variant="filled"
              leadingIcon={mdiPlus}
              disabled={availablePeople.length === 0}
              onclick={handleAddPeople}
            >
              {$t('add_people')}
            </Button>
          </div>

          <div class="max-h-64 immich-scrollbar overflow-y-auto">
            {#each selectedPeople as person (person.id)}
              <div class="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-subtle">
                <ImageThumbnail circle url={getPeopleThumbnailUrl(person)} altText={person.name} widthStyle="2.5rem" />
                <Text size="small" class="grow truncate">{person.name}</Text>
                <IconButton
                  shape="round"
                  size="small"
                  color="secondary"
                  variant="ghost"
                  icon={mdiClose}
                  aria-label={$t('remove')}
                  onclick={() => selectedIds.delete(person.id)}
                />
              </div>
            {:else}
              <Text size="small" color="muted" class="p-2">{$t('no_people_found')}</Text>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</FormModal>
