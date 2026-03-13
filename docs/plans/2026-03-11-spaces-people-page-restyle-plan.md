# Spaces People Page Restyle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle the spaces people page to visually match the main people page — circular thumbnails, inline name editing, hover context menus — while keeping the page simple (no pagination/search).

**Architecture:** Rewrite `/spaces/[spaceId]/people/+page.svelte` to replicate the card layout from `/people/+page.svelte`. Delete the custom `SpacePersonCard` component. Move alias editing to a context menu action. The page uses `ImageThumbnail` for circular portraits, an inline name input below each card, and a 3-dot context menu with "Set alias" and "Merge" options.

**Tech Stack:** SvelteKit, Svelte 5 runes, `@immich/sdk`, `@immich/ui`, Tailwind CSS 4

---

### Task 1: Delete SpacePersonCard and rewrite the people page

**Files:**

- Delete: `web/src/lib/components/spaces/space-person-card.svelte`
- Rewrite: `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`

**Step 1: Rewrite the spaces people page**

Replace the entire contents of `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte` with:

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { shortcut } from '$lib/actions/shortcut';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { Route } from '$lib/route';
  import { createUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    deleteSpacePersonAlias,
    getSpacePeople,
    Role,
    setSpacePersonAlias,
    updateSpacePerson,
    type SharedSpaceMemberResponseDto,
    type SharedSpacePersonResponseDto,
    type SharedSpaceResponseDto,
  } from '@immich/sdk';
  import { Icon, IconButton, toastManager } from '@immich/ui';
  import {
    mdiAccountGroupOutline,
    mdiAccountMultipleCheckOutline,
    mdiArrowLeft,
    mdiDotsVertical,
    mdiLabelOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let space: SharedSpaceResponseDto = $state(data.space);
  let members: SharedSpaceMemberResponseDto[] = $state(data.members);
  let people = $state<SharedSpacePersonResponseDto[]>(data.people);

  // Alias editing state
  let editingAliasId = $state<string | null>(null);
  let aliasInput = $state('');

  // Name editing state
  let editingName = $state('');

  // Hover state for context menus
  let hoveredPersonId = $state<string | null>(null);

  const currentMember = $derived(members.find((m) => m.userId === data.space.createdById));
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

  // Name editing handlers (inline input below circle)
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

  // Alias handlers (via context menu)
  function startAliasEdit(personId: string) {
    const person = people.find((p) => p.id === personId);
    editingAliasId = personId;
    aliasInput = person?.alias ?? '';
  }

  async function saveAlias(personId: string) {
    const trimmed = aliasInput.trim();
    try {
      if (trimmed) {
        await setSpacePersonAlias({
          id: space.id,
          personId,
          sharedSpacePersonAliasDto: { alias: trimmed },
        });
        toastManager.success($t('spaces_alias_saved'));
      } else {
        await deleteSpacePersonAlias({ id: space.id, personId });
        toastManager.success($t('spaces_alias_cleared'));
      }
      editingAliasId = null;
      aliasInput = '';
      await refreshPeople();
    } catch (error) {
      handleError(error, $t('spaces_error_saving_alias'));
    }
  }

  function cancelAlias() {
    editingAliasId = null;
    aliasInput = '';
  }

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
          onmouseleave={() => (hoveredPersonId = person.id === editingAliasId ? person.id : null)}
          role="group"
        >
          <!-- Circular thumbnail -->
          <a href="/spaces/{space.id}/people/{person.id}" draggable="false">
            <div class="h-full w-full rounded-xl brightness-95 filter">
              <ImageThumbnail
                shadow
                url={getThumbUrl(person)}
                altText={person.alias || person.name || ''}
                title={person.alias || person.name || null}
                widthStyle="100%"
                circle
                preload={false}
              />
            </div>
          </a>

          <!-- Context menu (hover) -->
          {#if isEditor && (hoveredPersonId === person.id || editingAliasId === person.id)}
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
                  onClick={() => startAliasEdit(person.id)}
                  icon={mdiLabelOutline}
                  text={$t('spaces_set_alias')}
                />
                <MenuOption
                  onClick={() => handleMerge(person.id)}
                  icon={mdiAccountMultipleCheckOutline}
                  text={$t('merge_people')}
                />
              </ButtonContextMenu>
            </div>
          {/if}

          <!-- Inline name input -->
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
            <p class="mt-2 truncate text-center text-sm font-medium">{person.alias || person.name}</p>
          {/if}

          <!-- Alias display (if set, show below name) -->
          {#if person.alias}
            <p class="truncate text-center text-xs text-gray-400 dark:text-gray-500">
              aka {person.alias}
            </p>
          {/if}

          <!-- Inline alias editor (shown when triggered from context menu) -->
          {#if editingAliasId === person.id}
            <div class="mt-1 flex gap-1">
              <input
                type="text"
                class="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                bind:value={aliasInput}
                placeholder={$t('spaces_alias_placeholder')}
                onkeydown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    void saveAlias(person.id);
                  }
                  if (e.key === 'Escape') {
                    cancelAlias();
                  }
                }}
              />
              <button
                type="button"
                class="rounded bg-immich-primary px-2 py-1 text-xs text-white hover:bg-immich-primary/90"
                onclick={() => void saveAlias(person.id)}
              >
                {$t('save')}
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</UserPageLayout>
```

**Step 2: Delete SpacePersonCard**

Delete the file `web/src/lib/components/spaces/space-person-card.svelte`.

**Step 3: Verify no other files import SpacePersonCard**

Run: `grep -r "SpacePersonCard\|space-person-card" web/src/`

If any other files import it, update them (there should be none after the rewrite).

**Step 4: Run format and lint**

```bash
make format-web
make lint-web
make check-web
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(spaces): restyle people page to match main people page

Replace custom SpacePersonCard with circular thumbnails, inline name
editing, and hover context menus matching the main /people page.
Alias editing now triggered from context menu."
```

---

### Task 2: Verify and push

**Step 1: Visual verification checklist**

Manually verify (or describe expected behavior):

- Cards show circular thumbnails with brightness filter
- Hovering shows 3-dot context menu with "Set alias" and "Merge"
- Name input below each circle, editable on focus, saves on blur/Enter
- Alias display shows "aka [alias]" below the name when set
- Context menu "Set alias" opens inline editor below the card
- Empty state matches main page style (centered icon + message)
- Back button in header navigates to space detail

**Step 2: Push**

```bash
git push
```
