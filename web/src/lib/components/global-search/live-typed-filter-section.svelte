<script lang="ts">
  import { createUrl, getPeopleThumbnailUrl } from '$lib/utils';
  import {
    liveTypedSearchChoiceValue,
    type LiveTypedSearchChoice,
    type LiveTypedSearchKey,
    type LiveTypedSearchPersonPreview,
    type LiveTypedSearchStatus,
  } from '$lib/utils/typed-search/typed-search-live-suggestions';
  import type { PersonResponseDto } from '@immich/sdk';
  import { Command } from 'bits-ui';
  import { t, type Translations } from 'svelte-i18n';

  interface Props {
    status: LiveTypedSearchStatus;
    onSelect: (choice: LiveTypedSearchChoice) => void;
  }
  let { status, onSelect }: Props = $props();

  const labelKey = $derived(
    status.status === 'idle'
      ? ('cmdk_filter_match_tag' as Translations)
      : (`cmdk_filter_match_${status.key}` as Translations),
  );
  const entity = $derived(status.status === 'idle' ? '' : status.key);

  function pluralEntity(key: LiveTypedSearchKey) {
    if (key === 'person') {
      return 'people';
    }
    if (key === 'country') {
      return 'countries';
    }
    if (key === 'city') {
      return 'cities';
    }
    return 'tags';
  }

  function getPersonPreview(choice: LiveTypedSearchChoice): LiveTypedSearchPersonPreview | null {
    return choice.preview?.kind === 'person' ? choice.preview.data : null;
  }

  function getPersonThumbUrl(person: LiveTypedSearchPersonPreview) {
    if (person.primaryProfile?.type === 'space-person' && person.primaryProfile.spaceId) {
      return createUrl(`/shared-spaces/${person.primaryProfile.spaceId}/people/${person.primaryProfile.id}/thumbnail`, {
        updatedAt: person.updatedAt,
      });
    }

    return getPeopleThumbnailUrl({ ...person, id: person.primaryProfile?.id ?? person.id } as PersonResponseDto);
  }
</script>

{#if status.status !== 'idle'}
  <Command.Group class="mb-4" data-live-typed-filter-section data-testid="live-typed-filter-section">
    <Command.GroupHeading
      class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
    >
      {$t(labelKey)}
    </Command.GroupHeading>
    <Command.GroupItems>
      {#if status.status === 'ok'}
        {#each status.items as choice (choice.id)}
          {@const personPreview = getPersonPreview(choice)}
          <Command.Item
            value={liveTypedSearchChoiceValue(choice)}
            onSelect={() => onSelect(choice)}
            onkeydown={(event) => {
              if (event.key === 'Enter') {
                onSelect(choice);
                event.preventDefault();
              }
            }}
            class="group"
          >
            <div
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-[80ms] ease-out group-data-[selected]:bg-primary/10"
            >
              {#if personPreview}
                <img
                  src={getPersonThumbUrl(personPreview)}
                  alt=""
                  class="h-8 w-8 shrink-0 rounded-full object-cover"
                  loading="lazy"
                />
              {/if}
              <span class="min-w-0 flex-1 truncate">
                <span>{choice.label}</span>
                {#if choice.secondaryLabel}
                  <span class="ms-2 text-xs text-gray-500 dark:text-gray-400">{choice.secondaryLabel}</span>
                {/if}
              </span>
              <span class="shrink-0 text-xs font-medium text-primary">{$t('cmdk_filter_use_as_filter')}</span>
            </div>
          </Command.Item>
        {/each}
      {:else if status.status === 'loading'}
        <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          {$t('cmdk_filter_match_loading', { values: { entity } })}
        </div>
      {:else if status.status === 'empty'}
        <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          {$t('cmdk_filter_match_none', { values: { entity: pluralEntity(status.key) } })}
        </div>
      {:else if status.status === 'timeout'}
        <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          {$t('cmdk_filter_match_timeout', { values: { entity } })}
        </div>
      {:else}
        <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          {$t('cmdk_filter_match_error', { values: { entity } })}
        </div>
      {/if}
    </Command.GroupItems>
  </Command.Group>
{/if}
