<script lang="ts">
  import { createUrl } from '$lib/utils';
  import type { SharedSpacePersonResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    people: SharedSpacePersonResponseDto[];
    spaceId: string;
    selectedPersonId?: string | null;
    onPersonClick?: (personId: string) => void;
  }

  let { people, spaceId, selectedPersonId = null, onPersonClick }: Props = $props();

  const SEE_ALL_THRESHOLD = 6;

  const getDisplayName = (person: SharedSpacePersonResponseDto): string => {
    return person.alias || person.name || '';
  };

  const getThumbUrl = (person: SharedSpacePersonResponseDto): string => {
    return createUrl(`/shared-spaces/${spaceId}/people/${person.id}/thumbnail`, { updatedAt: person.updatedAt });
  };
</script>

{#if people.length > 0}
  <div class="flex items-start gap-3 overflow-x-auto pt-4 pb-2 immich-scrollbar" data-testid="people-strip">
    {#each people as person (person.id)}
      <button
        type="button"
        class="flex w-16 shrink-0 flex-col items-center gap-1"
        onclick={() => onPersonClick?.(person.id)}
        data-testid="person-thumb-{person.id}"
      >
        <div
          class="size-14 overflow-hidden rounded-full transition-transform duration-150 hover:scale-105
            {selectedPersonId === person.id ? 'ring-2 ring-offset-2 ring-immich-primary' : ''}"
          data-testid="person-ring-{person.id}"
        >
          <img
            src={getThumbUrl(person)}
            alt={getDisplayName(person) || $t('person')}
            class="size-full object-cover"
            loading="lazy"
          />
        </div>
        {#if getDisplayName(person)}
          <span
            class="w-full truncate text-center text-xs {selectedPersonId === person.id
              ? 'font-semibold text-immich-primary'
              : 'text-gray-600 dark:text-gray-400'}"
            data-testid="person-label-{person.id}"
          >
            {getDisplayName(person)}
          </span>
        {/if}
      </button>
    {/each}

    {#if people.length > SEE_ALL_THRESHOLD}
      <a
        href="/spaces/{spaceId}/people"
        class="flex shrink-0 items-center gap-0.5 whitespace-nowrap py-4 text-xs font-medium text-immich-primary hover:underline"
        data-testid="see-all-people"
      >
        {$t('spaces_see_all_people', { values: { count: people.length } })}
        <Icon icon={mdiChevronRight} size="14" />
      </a>
    {/if}
  </div>
{/if}
