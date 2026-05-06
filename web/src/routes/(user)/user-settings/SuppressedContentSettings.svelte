<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/Combobox.svelte';
  import TagPill from '$lib/components/shared-components/TagPill.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { Route } from '$lib/route';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    getAllTags,
    getAuthStatus,
    getPerson,
    searchPerson,
    SuppressionScope,
    updateMyPreferences,
    upsertTags,
    type PersonResponseDto,
    type TagResponseDto,
  } from '@immich/sdk';
  import { Button, Field, IconButton, Text, toastManager } from '@immich/ui';
  import { mdiClose, mdiLockOpenVariantOutline, mdiShieldLockOutline } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let isElevated = $state(false);
  let hasPinCode = $state(false);
  let isLoading = $state(true);
  let isSaving = $state(false);

  let allTags: TagResponseDto[] = $state([]);
  let selectedTagIds: string[] = $state(authManager.preferences.privacy?.suppression?.tagIds ?? []);
  let selectedPeople: PersonResponseDto[] = $state([]);
  let selectedPersonIds: string[] = $state(authManager.preferences.privacy?.suppression?.personIds ?? []);
  let scope: SuppressionScope = $state(authManager.preferences.privacy?.suppression?.scope ?? SuppressionScope.Owned);

  let tagOption: ComboBoxOption | undefined = $state();
  let peopleSearch = $state('');
  let peopleResults: PersonResponseDto[] = $state([]);
  let isSearchingPeople = $state(false);
  let searchTimeout: ReturnType<typeof setTimeout> | undefined;
  let abortController: AbortController | undefined;

  const tagMap = $derived(Object.fromEntries(allTags.map((tag) => [tag.id, tag])));
  const selectedPeopleIds = $derived(new Set(selectedPeople.map((person) => person.id)));
  const canSave = $derived(isElevated && !isSaving);

  const continueUrl = () => page.url.pathname + '?isOpen=suppressed-content';

  onMount(async () => {
    await refreshLockState();
  });

  onDestroy(() => {
    abortController?.abort();
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  });

  const refreshLockState = async () => {
    try {
      const status = await getAuthStatus();
      isElevated = !!status.isElevated;
      hasPinCode = !!status.pinCode;
      if (isElevated && hasPinCode) {
        await loadSuppressionNames();
      }
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    } finally {
      isLoading = false;
    }
  };

  const loadSuppressionNames = async () => {
    const [tags, people] = await Promise.all([
      getAllTags(),
      Promise.allSettled(selectedPersonIds.map((id) => getPerson({ id }))),
    ]);
    const tagIds = new Set(tags.map((tag) => tag.id));
    const peopleIds = new Set(selectedPersonIds);
    const resolvedPeople = people
      .filter((result): result is PromiseFulfilledResult<PersonResponseDto> => result.status === 'fulfilled')
      .map((result) => result.value)
      .filter((person) => peopleIds.has(person.id));

    allTags = tags;
    selectedTagIds = selectedTagIds.filter((id) => tagIds.has(id));
    selectedPeople = resolvedPeople;
    selectedPersonIds = resolvedPeople.map((person) => person.id);
  };

  const unlock = async () => {
    await goto(Route.pinPrompt({ continue: continueUrl() }));
  };

  const addTag = (tag: TagResponseDto) => {
    if (!selectedTagIds.includes(tag.id)) {
      selectedTagIds = [...selectedTagIds, tag.id];
    }
  };

  const handleTagSelect = async (option?: ComboBoxOption) => {
    tagOption = undefined;
    if (!option) {
      return;
    }

    try {
      if (option.id) {
        const tag = allTags.find((tag) => tag.id === option.value);
        if (tag) {
          addTag(tag);
        }
        return;
      }

      const [newTag] = await upsertTags({ tagUpsertDto: { tags: [option.label] } });
      allTags = [...allTags, newTag];
      addTag(newTag);
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_settings'));
    }
  };

  const removeTag = (id: string) => {
    selectedTagIds = selectedTagIds.filter((tagId) => tagId !== id);
  };

  const addPerson = (person: PersonResponseDto) => {
    if (!selectedPeopleIds.has(person.id)) {
      selectedPeople = [...selectedPeople, person];
      selectedPersonIds = [...selectedPersonIds, person.id];
    }
    peopleSearch = '';
    peopleResults = [];
  };

  const removePerson = (id: string) => {
    selectedPeople = selectedPeople.filter((person) => person.id !== id);
    selectedPersonIds = selectedPersonIds.filter((personId) => personId !== id);
  };

  const runPeopleSearch = async (name: string) => {
    const controller = new AbortController();
    abortController = controller;
    isSearchingPeople = true;

    try {
      const results = await searchPerson({ name, withHidden: true }, { signal: controller.signal });
      peopleResults = results.filter((person) => !selectedPeopleIds.has(person.id));
    } catch (error) {
      if (!controller.signal.aborted) {
        handleError(error, $t('errors.cant_search_people'));
      }
    } finally {
      if (abortController === controller) {
        isSearchingPeople = false;
      }
    }
  };

  const searchPeople = () => {
    abortController?.abort();
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const name = peopleSearch.trim();
    if (!name) {
      peopleResults = [];
      isSearchingPeople = false;
      return;
    }

    searchTimeout = setTimeout(() => {
      void runPeopleSearch(name);
    }, 250);
  };

  const save = async () => {
    isSaving = true;
    try {
      const response = await updateMyPreferences({
        userPreferencesUpdateDto: {
          privacy: {
            suppression: {
              tagIds: selectedTagIds,
              personIds: selectedPersonIds,
              scope,
            },
          },
        },
      });
      authManager.setPreferences(response);
      toastManager.primary($t('saved_settings'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_settings'));
    } finally {
      isSaving = false;
    }
  };
</script>

<section class="my-4">
  {#if isLoading}
    <Text color="muted" size="small">{$t('loading')}</Text>
  {:else if !isElevated || !hasPinCode}
    <div class="flex max-w-3xl flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div class="flex items-start gap-3">
        <div class="rounded-full bg-primary/10 p-2 text-primary">
          <svg viewBox="0 0 24 24" class="size-6" aria-hidden="true">
            <path fill="currentColor" d={mdiShieldLockOutline} />
          </svg>
        </div>
        <div>
          <p class="font-medium text-immich-fg dark:text-immich-dark-fg">{$t('suppressed_content_locked_title')}</p>
          <Text color="muted" size="small">{$t('suppressed_content_locked_description')}</Text>
        </div>
      </div>
      <div>
        <Button size="small" shape="round" onclick={unlock}>
          {$t(hasPinCode ? 'unlock' : 'create_pin_code')}
        </Button>
      </div>
    </div>
  {:else}
    <div class="flex max-w-4xl flex-col gap-6 sm:ms-4 md:ms-8">
      <Field label={$t('suppression_scope')} description={$t('suppression_scope_description')}>
        <div
          class="inline-flex rounded-full border border-gray-300 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900"
        >
          <button
            type="button"
            class="rounded-full px-4 py-1.5 text-sm transition-colors"
            class:bg-primary={scope === SuppressionScope.Owned}
            class:text-white={scope === SuppressionScope.Owned}
            class:dark:text-immich-dark-gray={scope === SuppressionScope.Owned}
            onclick={() => (scope = SuppressionScope.Owned)}
          >
            {$t('my_library')}
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-1.5 text-sm transition-colors"
            class:bg-primary={scope === SuppressionScope.Visible}
            class:text-white={scope === SuppressionScope.Visible}
            class:dark:text-immich-dark-gray={scope === SuppressionScope.Visible}
            onclick={() => (scope = SuppressionScope.Visible)}
          >
            {$t('all_visible_assets')}
          </button>
        </div>
      </Field>

      <Field label={$t('suppressed_tags')} description={$t('suppressed_tags_description')}>
        <div class="max-w-sm">
          <Combobox
            bind:selectedOption={tagOption}
            onSelect={handleTagSelect}
            label={$t('tag')}
            allowCreate
            defaultFirstOption
            options={allTags.map((tag) => ({ id: tag.id, label: tag.value, value: tag.id }))}
            placeholder={$t('search_tags')}
          />
        </div>
        <section class="mt-3 flex flex-wrap gap-2">
          {#each selectedTagIds as tagId (tagId)}
            {@const tag = tagMap[tagId]}
            {#if tag}
              <TagPill label={tag.value} onRemove={() => removeTag(tagId)} />
            {/if}
          {/each}
        </section>
      </Field>

      <Field label={$t('suppressed_people')} description={$t('suppressed_people_description')}>
        <div class="relative max-w-sm">
          <input
            class="immich-form-input w-full text-sm"
            type="text"
            autocomplete="off"
            placeholder={$t('search_people')}
            bind:value={peopleSearch}
            oninput={searchPeople}
          />
          {#if peopleResults.length > 0 || isSearchingPeople}
            <div
              class="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              {#if isSearchingPeople}
                <p class="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">{$t('loading')}</p>
              {/if}
              {#each peopleResults as person (person.id)}
                <button
                  type="button"
                  class="flex w-full items-center gap-3 px-3 py-2 text-start text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onclick={() => addPerson(person)}
                >
                  <img
                    class="size-8 rounded-full object-cover"
                    src={getPeopleThumbnailUrl(person)}
                    alt=""
                    loading="lazy"
                  />
                  <span class="truncate">{person.name || $t('unnamed_person')}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <section class="mt-3 flex flex-wrap gap-2">
          {#each selectedPeople as person (person.id)}
            <div class="group relative">
              <img
                class="size-10 rounded-full border border-gray-200 object-cover dark:border-gray-700"
                src={getPeopleThumbnailUrl(person)}
                alt={person.name || $t('unnamed_person')}
                title={person.name || $t('unnamed_person')}
                loading="lazy"
              />
              <div class="absolute -top-2 -right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <IconButton
                  size="small"
                  shape="round"
                  variant="filled"
                  color="secondary"
                  aria-label={$t('remove_person')}
                  icon={mdiClose}
                  onclick={() => removePerson(person.id)}
                />
              </div>
            </div>
          {/each}
        </section>
      </Field>

      <div class="flex flex-wrap justify-between gap-3">
        <Button size="small" shape="round" variant="ghost" onclick={() => goto(Route.suppressed())}>
          <span class="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
              <path fill="currentColor" d={mdiLockOpenVariantOutline} />
            </svg>
            {$t('view_suppressed_content')}
          </span>
        </Button>
        <Button shape="round" size="small" disabled={!canSave} loading={isSaving} onclick={save}>{$t('save')}</Button>
      </div>
    </div>
  {/if}
</section>
