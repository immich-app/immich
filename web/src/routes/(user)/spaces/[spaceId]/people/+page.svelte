<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import PeopleManagementGrid from '$lib/components/people/people-management-grid.svelte';
  import PeopleMergeSelector from '$lib/components/people/people-merge-selector.svelte';
  import type { ManagedPerson } from '$lib/components/people/people-types';
  import ManageSpacePeopleVisibility from '$lib/components/spaces/manage-space-people-visibility.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import PersonEditBirthDateModal from '$lib/modals/PersonEditBirthDateModal.svelte';
  import { createUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    getSpacePeople,
    mergeSpacePeople,
    SharedSpaceRole,
    updateSpacePerson,
    type SharedSpaceMemberResponseDto,
    type SharedSpacePersonResponseDto,
    type SharedSpaceResponseDto,
  } from '@immich/sdk';
  import { Button, Icon, IconButton, modalManager, toastManager } from '@immich/ui';
  import {
    mdiAccountGroupOutline,
    mdiAccountMultipleCheckOutline,
    mdiCalendarEditOutline,
    mdiArrowLeft,
    mdiDotsVertical,
    mdiEyeOffOutline,
    mdiEyeOutline,
  } from '@mdi/js';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const PAGE_SIZE = 100;

  const space: SharedSpaceResponseDto = $derived(data.space);
  const members: SharedSpaceMemberResponseDto[] = $derived(data.members);
  let people = $state<SharedSpacePersonResponseDto[]>([]);
  let loadedSpaceId = $state('');
  let loading = $state(false);
  let hasMore = $state(false);

  let selectHidden = $state(false);
  const visiblePeople = $derived(people.filter((p) => !p.isHidden));
  let allPeople = $state<SharedSpacePersonResponseDto[]>([]);
  let mergingPerson = $state<SharedSpacePersonResponseDto>();

  $effect(() => {
    if (data.space.id !== loadedSpaceId) {
      people = data.people;
      hasMore = data.people.length >= PAGE_SIZE;
      mergingPerson = undefined;
      loadedSpaceId = data.space.id;
    }
  });

  const currentMember = $derived(members.find((m) => m.userId === authManager.user.id));
  const isOwner = $derived(currentMember?.role === SharedSpaceRole.Owner);
  const isEditor = $derived(isOwner || currentMember?.role === SharedSpaceRole.Editor);

  const getThumbUrl = (person: SharedSpacePersonResponseDto): string => {
    return createUrl(`/shared-spaces/${space.id}/people/${person.id}/thumbnail`, { updatedAt: person.updatedAt });
  };

  const toManagedPerson = (person: SharedSpacePersonResponseDto): ManagedPerson => ({
    id: person.id,
    displayName: person.name || '',
    canonicalName: person.name,
    thumbnailUrl: getThumbUrl(person),
    href: `/spaces/${space.id}/people/${person.id}`,
    isHidden: person.isHidden,
    type: person.type,
    assetCount: person.assetCount,
    faceCount: person.faceCount,
  });

  async function refreshPeople() {
    try {
      people = await getSpacePeople({ id: space.id, limit: PAGE_SIZE });
      hasMore = people.length >= PAGE_SIZE;
    } catch (error) {
      handleError(error, $t('spaces_error_loading_people'));
    }
  }

  async function loadMore() {
    if (loading || !hasMore) {
      return;
    }
    loading = true;
    try {
      const more = await getSpacePeople({ id: space.id, limit: PAGE_SIZE, offset: people.length });
      people = [...people, ...more];
      hasMore = more.length >= PAGE_SIZE;
    } catch (error) {
      handleError(error, $t('spaces_error_loading_people'));
    } finally {
      loading = false;
    }
  }

  async function openVisibilityModal() {
    try {
      allPeople = await getSpacePeople({ id: space.id, withHidden: true, limit: PAGE_SIZE });
    } catch (error) {
      handleError(error, $t('spaces_error_loading_people'));
      return;
    }
    hasMoreVisibility = allPeople.length >= PAGE_SIZE;
    selectHidden = true;
  }

  let hasMoreVisibility = $state(false);
  let loadingVisibility = $state(false);

  async function loadMoreVisibility() {
    if (loadingVisibility || !hasMoreVisibility) {
      return;
    }
    loadingVisibility = true;
    try {
      const more = await getSpacePeople({
        id: space.id,
        withHidden: true,
        limit: PAGE_SIZE,
        offset: allPeople.length,
      });
      allPeople = [...allPeople, ...more];
      hasMoreVisibility = more.length >= PAGE_SIZE;
    } catch (error) {
      handleError(error, $t('spaces_error_loading_people'));
    } finally {
      loadingVisibility = false;
    }
  }

  const onNameSubmit = async (name: string, person: SharedSpacePersonResponseDto) => {
    try {
      if (name === person.name) {
        return;
      }
      await updateSpacePerson({
        id: space.id,
        personId: person.id,
        sharedSpacePersonUpdateDto: { name },
      });
      await refreshPeople();
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_name'));
    }
  };

  const getMergeDisplayName = (person: SharedSpacePersonResponseDto) => person.name || '';

  const loadMergePeople = async () => {
    return getSpacePeople({ id: space.id, limit: PAGE_SIZE });
  };

  const mergePeople = async (
    targetPerson: SharedSpacePersonResponseDto,
    selectedPeople: SharedSpacePersonResponseDto[],
  ) => {
    await mergeSpacePeople({
      id: space.id,
      personId: targetPerson.id,
      sharedSpacePersonMergeDto: { ids: selectedPeople.map(({ id }) => id) },
    });
    toastManager.success($t('spaces_people_merged'));
    return targetPerson;
  };

  async function handleMergeComplete() {
    mergingPerson = undefined;
    await refreshPeople();
  }

  async function openBirthDateModal(selectedPerson: SharedSpacePersonResponseDto) {
    const person = people.find(({ id }) => id === selectedPerson.id) ?? selectedPerson;
    await modalManager.show(PersonEditBirthDateModal, {
      birthDate: person.birthDate,
      onSave: async (birthDate) => {
        try {
          const updatedPerson = await updateSpacePerson({
            id: space.id,
            personId: person.id,
            sharedSpacePersonUpdateDto: { birthDate },
          });
          const savedPerson = { ...person, ...updatedPerson, birthDate: updatedPerson.birthDate ?? birthDate };
          people = people.map((currentPerson) => (currentPerson.id === person.id ? savedPerson : currentPerson));
          toastManager.success($t('date_of_birth_saved'));
          return true;
        } catch (error) {
          handleError(error, $t('errors.unable_to_save_date_of_birth'));
          return false;
        }
      },
    });
  }

  async function handleHide(person: SharedSpacePersonResponseDto) {
    try {
      await updateSpacePerson({
        id: space.id,
        personId: person.id,
        sharedSpacePersonUpdateDto: { isHidden: true },
      });
      const idx = people.findIndex((p) => p.id === person.id);
      if (idx !== -1) {
        people[idx] = { ...people[idx], isHidden: true };
      }
      toastManager.primary($t('changed_visibility_successfully'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_hide_person'));
    }
  }
</script>

<UserPageLayout title={$t('spaces_people_title')}>
  {#snippet leading()}
    <IconButton
      variant="ghost"
      shape="round"
      color="secondary"
      aria-label={$t('back')}
      onclick={() => goto(`/spaces/${space.id}`)}
      icon={mdiArrowLeft}
    />
  {/snippet}
  {#snippet buttons()}
    {#if isEditor}
      <Button leadingIcon={mdiEyeOutline} onclick={openVisibilityModal} size="small" variant="ghost" color="secondary"
        >{$t('show_and_hide_people')}</Button
      >
    {/if}
  {/snippet}

  {#if visiblePeople.length === 0}
    <div class="flex min-h-[calc(66vh-11rem)] w-full place-content-center items-center dark:text-white">
      <div class="flex flex-col content-center items-center text-center">
        <Icon icon={mdiAccountGroupOutline} size="3.5em" />
        <p class="mt-5 text-lg text-gray-500 dark:text-gray-400">{$t('spaces_no_people')}</p>
        <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
          {$t('spaces_no_people_description')}
        </p>
      </div>
    </div>
  {:else}
    <div class="px-4 pt-4">
      <PeopleManagementGrid
        people={visiblePeople}
        {toManagedPerson}
        gridClass="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8"
        hasNextPage={hasMore}
        {loading}
        loadNextPage={loadMore}
        canEditNames={isEditor}
        canShowActions={isEditor}
        {onNameSubmit}
      >
        {#snippet actions(person)}
          <ButtonContextMenu
            buttonClass="icon-white-drop-shadow"
            color="secondary"
            size="medium"
            variant="filled"
            icon={mdiDotsVertical}
            title={$t('show_person_options')}
          >
            <MenuOption
              onClick={() => void openBirthDateModal(person)}
              icon={mdiCalendarEditOutline}
              text={$t('set_date_of_birth')}
            />
            <MenuOption onClick={() => handleHide(person)} icon={mdiEyeOffOutline} text={$t('hide_person')} />
            <MenuOption
              onClick={() => (mergingPerson = person)}
              icon={mdiAccountMultipleCheckOutline}
              text={$t('merge_people')}
            />
          </ButtonContextMenu>
        {/snippet}
      </PeopleManagementGrid>
    </div>
  {/if}

  {#if mergingPerson}
    <PeopleMergeSelector
      person={mergingPerson}
      getDisplayName={getMergeDisplayName}
      getThumbnailUrl={getThumbUrl}
      loadPeople={loadMergePeople}
      {mergePeople}
      onBack={() => (mergingPerson = undefined)}
      onMerge={() => void handleMergeComplete()}
      showSimilaritySort={false}
      loadErrorMessage={$t('spaces_error_loading_people')}
      mergeErrorMessage={$t('spaces_error_merging_people')}
    />
  {/if}
</UserPageLayout>

{#if selectHidden}
  <dialog
    transition:fly={{ y: 500, duration: 150, easing: quintOut, opacity: 0 }}
    class="fixed inset-0 h-full w-full max-w-none max-h-none bg-light"
    aria-labelledby="manage-visibility-title"
    {@attach (dialog) => dialog.showModal()}
  >
    <ManageSpacePeopleVisibility
      people={allPeople}
      spaceId={space.id}
      onClose={() => (selectHidden = false)}
      onUpdate={() => refreshPeople()}
      hasMore={hasMoreVisibility}
      loading={loadingVisibility}
      onLoadMore={loadMoreVisibility}
    />
  </dialog>
{/if}
