<script lang="ts" generics="T extends { id: string }">
  import { shortcut } from '$lib/actions/shortcut';
  import PeopleGrid from '$lib/components/people/people-grid.svelte';
  import PersonTile from '$lib/components/people/person-tile.svelte';
  import type { ManagedPerson } from '$lib/components/people/people-types';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    people: T[];
    toManagedPerson: (person: T) => ManagedPerson;
    gridClass?: string;
    cardClass?: string;
    nameInputClass?: string;
    readonlyNameClass?: string;
    hasNextPage?: boolean;
    loading?: boolean;
    loadNextPage: () => void;
    canEditNames?: boolean | ((person: T) => boolean);
    canShowActions?: boolean | ((person: T) => boolean);
    onNameSubmit?: (name: string, person: T) => void | Promise<void>;
    actions?: Snippet<[T]>;
  }

  let {
    people,
    toManagedPerson,
    gridClass = 'w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-10 gap-1',
    cardClass = 'p-2 rounded-xl hover:bg-gray-200 border-2 hover:border-immich-primary/50 hover:shadow-sm dark:hover:bg-immich-dark-primary/20 hover:dark:border-immich-dark-primary/25 border-transparent transition-all',
    nameInputClass = 'bg-white dark:bg-immich-dark-gray border-gray-100 placeholder-gray-400 text-center dark:border-gray-900 w-full rounded-2xl mt-2 py-2 text-sm text-primary',
    readonlyNameClass = 'mt-2 truncate text-center text-sm font-medium',
    hasNextPage = false,
    loading = false,
    loadNextPage,
    canEditNames = false,
    canShowActions = true,
    onNameSubmit = () => {},
    actions,
  }: Props = $props();

  let editingName = $state('');

  const isNameEditable = (person: T) => (typeof canEditNames === 'function' ? canEditNames(person) : canEditNames);

  const shouldShowActions = (person: T) =>
    !!actions && (typeof canShowActions === 'function' ? canShowActions(person) : canShowActions);

  const handleNameFocus = (person: ManagedPerson) => {
    editingName = person.canonicalName ?? person.displayName;
  };

  const handleNameInput = (event: Event) => {
    if (event.target) {
      editingName = (event.target as HTMLInputElement).value;
    }
  };

  const handleNameSubmit = async (person: T) => {
    await onNameSubmit(editingName, person);
  };
</script>

<PeopleGrid items={people} class={gridClass} {hasNextPage} {loading} {loadNextPage}>
  {#snippet children(person)}
    {@const managedPerson = toManagedPerson(person)}
    <div class={cardClass}>
      <PersonTile person={managedPerson} showActionMenu={shouldShowActions(person)}>
        {#snippet actionMenu()}
          {@render actions?.(person)}
        {/snippet}

        {#snippet footer()}
          {#if isNameEditable(person)}
            <input
              type="text"
              class={nameInputClass}
              value={managedPerson.canonicalName ?? managedPerson.displayName}
              placeholder={$t('add_a_name')}
              use:shortcut={{ shortcut: { key: 'Enter' }, onShortcut: (e) => e.currentTarget.blur() }}
              onfocusin={() => handleNameFocus(managedPerson)}
              onfocusout={() => void handleNameSubmit(person)}
              oninput={handleNameInput}
            />
          {:else if managedPerson.displayName}
            <p class={readonlyNameClass}>{managedPerson.displayName}</p>
          {/if}
        {/snippet}
      </PersonTile>
    </div>
  {/snippet}
</PeopleGrid>
