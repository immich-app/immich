<script lang="ts">
  import { goto } from '$app/navigation';
  import { shortcut } from '$lib/actions/shortcut';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { user } from '$lib/stores/user.store';
  import { createUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    getSpacePeople,
    Role,
    updateSpacePerson,
    type SharedSpaceMemberResponseDto,
    type SharedSpacePersonResponseDto,
    type SharedSpaceResponseDto,
  } from '@immich/sdk';
  import { Icon, IconButton } from '@immich/ui';
  import { mdiAccountGroupOutline, mdiAccountMultipleCheckOutline, mdiArrowLeft, mdiDotsVertical } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let space: SharedSpaceResponseDto = $state(data.space);
  let members: SharedSpaceMemberResponseDto[] = $state(data.members);
  let people = $state<SharedSpacePersonResponseDto[]>(data.people);

  // Name editing state
  let editingName = $state('');

  // Hover state for context menus
  let hoveredPersonId = $state<string | null>(null);

  const currentMember = $derived(members.find((m) => m.userId === $user.id));
  const isOwner = $derived(currentMember?.role === Role.Owner);
  const isEditor = $derived(isOwner || currentMember?.role === Role.Editor);

  const getThumbUrl = (person: SharedSpacePersonResponseDto): string => {
    return createUrl(`/shared-spaces/${space.id}/people/${person.id}/thumbnail`, { updatedAt: person.updatedAt });
  };

  async function refreshPeople() {
    try {
      people = await getSpacePeople({ id: space.id });
    } catch (error) {
      handleError(error, $t('spaces_error_loading_people'));
    }
  }

  const onNameFocus = (person: SharedSpacePersonResponseDto) => {
    editingName = person.name;
  };

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

  const onNameInput = (event: Event) => {
    if (event.target) {
      editingName = (event.target as HTMLInputElement).value;
    }
  };

  function handleMerge(personId: string) {
    void goto(`/spaces/${space.id}/people/${personId}?action=merge`);
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

  {#if people.length === 0}
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
    <div
      class="grid grid-cols-2 gap-4 px-4 pt-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8"
    >
      {#each people as person (person.id)}
        <div
          class="relative rounded-xl border-2 border-transparent p-2 transition-all hover:border-immich-primary/50 hover:bg-gray-200 hover:shadow-sm dark:hover:border-immich-dark-primary/25 dark:hover:bg-immich-dark-primary/20"
          onmouseenter={() => (hoveredPersonId = person.id)}
          onmouseleave={() => (hoveredPersonId = null)}
          role="group"
        >
          <a href="/spaces/{space.id}/people/{person.id}" draggable="false">
            <div class="w-full rounded-xl brightness-95 filter">
              <ImageThumbnail
                shadow
                url={getThumbUrl(person)}
                altText={person.name || ''}
                title={person.name || null}
                widthStyle="100%"
                circle
                preload={false}
              />
            </div>
          </a>

          {#if isEditor && hoveredPersonId === person.id}
            <div class="absolute end-4 top-4 z-1">
              <ButtonContextMenu
                buttonClass="icon-white-drop-shadow"
                color="secondary"
                size="medium"
                variant="filled"
                icon={mdiDotsVertical}
                title={$t('show_person_options')}
              >
                <MenuOption
                  onClick={() => handleMerge(person.id)}
                  icon={mdiAccountMultipleCheckOutline}
                  text={$t('merge_people')}
                />
              </ButtonContextMenu>
            </div>
          {/if}

          {#if isEditor}
            <input
              type="text"
              class="mt-2 w-full rounded-2xl border-gray-100 bg-white py-2 text-center text-sm text-primary placeholder-gray-400 dark:border-gray-900 dark:bg-immich-dark-gray"
              value={person.name}
              placeholder={$t('add_a_name')}
              use:shortcut={{ shortcut: { key: 'Enter' }, onShortcut: (e) => e.currentTarget.blur() }}
              onfocusin={() => onNameFocus(person)}
              onfocusout={() => onNameSubmit(editingName, person)}
              oninput={(event) => onNameInput(event)}
            />
          {:else if person.name}
            <p class="mt-2 truncate text-center text-sm font-medium">{person.name}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</UserPageLayout>
