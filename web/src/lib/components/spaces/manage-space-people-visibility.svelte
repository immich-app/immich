<script lang="ts">
  import PeopleVisibilityModal from '$lib/components/people/people-visibility-modal.svelte';
  import type { VisibilityChange, VisibilityPerson, VisibilitySaveResult } from '$lib/components/people/people-types';
  import { createUrl } from '$lib/utils';
  import { updateSpacePerson, type SharedSpacePersonResponseDto } from '@immich/sdk';

  interface Props {
    people: SharedSpacePersonResponseDto[];
    spaceId: string;
    onClose: () => void;
    onUpdate: (people: SharedSpacePersonResponseDto[]) => void;
    hasMore?: boolean;
    loading?: boolean;
    onLoadMore?: () => void;
  }

  let { people, spaceId, onClose, onUpdate, hasMore = false, loading = false, onLoadMore = () => {} }: Props = $props();

  const visibilityPeople: VisibilityPerson[] = $derived(
    people.map((person) => ({
      id: person.id,
      displayName: person.name || '',
      thumbnailUrl: createUrl(`/shared-spaces/${spaceId}/people/${person.id}/thumbnail`, {
        updatedAt: person.updatedAt,
      }),
      isHidden: person.isHidden,
    })),
  );

  const saveVisibilityChanges = async (changes: VisibilityChange[]): Promise<VisibilitySaveResult> => {
    const results = await Promise.allSettled(
      changes.map(({ id, isHidden }) =>
        updateSpacePerson({ id: spaceId, personId: id, sharedSpacePersonUpdateDto: { isHidden } }),
      ),
    );
    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    return { successCount, failCount: results.length - successCount };
  };

  const handleUpdate = (updatedVisibilityPeople: VisibilityPerson[]) => {
    const hiddenById = new Map(updatedVisibilityPeople.map((person) => [person.id, person.isHidden]));
    onUpdate(people.map((person) => ({ ...person, isHidden: hiddenById.get(person.id) ?? person.isHidden })));
  };
</script>

<PeopleVisibilityModal
  people={visibilityPeople}
  {onClose}
  onUpdate={handleUpdate}
  gridClass="flex flex-wrap gap-1"
  personButtonClass="group relative"
  personStyle="width: 6rem; height: 6rem;"
  {hasMore}
  {loading}
  loadNextPage={onLoadMore}
  {saveVisibilityChanges}
  deferThumbnails
/>
