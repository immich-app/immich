<script lang="ts">
  import PeopleManagementGrid from '$lib/components/people/people-management-grid.svelte';
  import type { ManagedPerson } from '$lib/components/people/people-types';

  type Person = {
    id: string;
    name: string;
    href?: string;
    thumbnailUrl?: string;
  };

  interface Props {
    people?: Person[];
    canEditNames?: boolean;
    canShowActions?: boolean;
    onNameSubmit?: (name: string, person: Person) => void | Promise<void>;
    onAction?: (person: Person) => void;
    loadNextPage?: () => void;
  }

  let {
    people = [{ id: 'person-1', name: 'Ada Lovelace' }],
    canEditNames = true,
    canShowActions = true,
    onNameSubmit = () => {},
    onAction = () => {},
    loadNextPage = () => {},
  }: Props = $props();

  const toManagedPerson = (person: Person): ManagedPerson => ({
    id: person.id,
    displayName: person.name,
    canonicalName: person.name,
    thumbnailUrl: person.thumbnailUrl ?? `/api/people/${person.id}/thumbnail`,
    href: person.href ?? `/people/${person.id}`,
    isHidden: false,
  });
</script>

<PeopleManagementGrid {people} {toManagedPerson} {canEditNames} {canShowActions} {onNameSubmit} {loadNextPage}>
  {#snippet actions(person)}
    <button type="button" onclick={() => onAction(person)}>Actions</button>
  {/snippet}
</PeopleManagementGrid>
