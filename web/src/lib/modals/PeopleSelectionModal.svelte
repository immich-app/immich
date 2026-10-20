<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import { type PersonResponseDto } from '@immich/sdk';
  import {
    ActionButton,
    Button,
    HStack,
    ListButton,
    Modal,
    ModalBody,
    ModalFooter,
    Text,
    type ActionItem,
  } from '@immich/ui';
  import { mdiCheckAll, mdiCloseBoxMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    people: PersonResponseDto[];
    selectedPeople?: PersonResponseDto[];
    onClose: (people?: PersonResponseDto[]) => void;
  };

  let { people, onClose, selectedPeople = $bindable<PersonResponseDto[]>([]) }: Props = $props();

  let searchName = $state('');

  const selectedIds = $derived(new Set(selectedPeople.map(({ id }) => id)));
  const filteredPeople = $derived(
    people.filter(({ name }) => !searchName || normalizeSearchString(name).includes(normalizeSearchString(searchName))),
  );
  const namedPeople = $derived(filteredPeople.filter(({ name }) => name));
  const unnamedPeople = $derived(filteredPeople.filter(({ name }) => !name));

  const selectPerson = (person: PersonResponseDto) => {
    selectedPeople = selectedIds.has(person.id)
      ? selectedPeople.filter(({ id }) => id !== person.id)
      : [...selectedPeople, person];
  };

  const SelectAll: ActionItem = $derived({
    title: $t('select_all'),
    icon: mdiCheckAll,
    $if: () => filteredPeople.some(({ id }) => !selectedIds.has(id)),
    onAction: () => (selectedPeople = [...selectedPeople, ...filteredPeople.filter(({ id }) => !selectedIds.has(id))]),
  });

  const UnselectAll: ActionItem = $derived({
    title: $t('unselect_all'),
    icon: mdiCloseBoxMultipleOutline,
    $if: () => filteredPeople.some(({ id }) => selectedIds.has(id)),
    onAction: () => {
      const ids = new Set(filteredPeople.map(({ id }) => id));
      selectedPeople = selectedPeople.filter(({ id }) => !ids.has(id));
    },
  });
</script>

<Modal title={$t('manage_people')} {onClose} size="medium">
  <ModalBody class="flex min-h-0 flex-col">
    {#if people.length > 0}
      <div class="flex min-h-0 grow flex-col gap-4">
        <div class="flex justify-end gap-2">
          <ActionButton type="button" shape="round" size="small" action={UnselectAll} />
          <ActionButton type="button" shape="round" size="small" action={SelectAll} />
        </div>

        <div>
          <SearchBar bind:name={searchName} placeholder={$t('search_people')} showLoadingSpinner={false} />
        </div>

        <div class="flex min-h-0 grow immich-scrollbar flex-col gap-2 overflow-y-auto sm:max-h-120">
          {#each namedPeople as person (person.id)}
            <ListButton onclick={() => selectPerson(person)} selected={selectedIds.has(person.id)}>
              <ImageThumbnail circle url={getPeopleThumbnailUrl(person)} altText={person.name} widthStyle="4rem" />
              <Text fontWeight="medium" class="grow truncate text-start">{person.name}</Text>
            </ListButton>
          {/each}

          {#if unnamedPeople.length > 0}
            <div class="flex flex-wrap gap-2 p-1">
              {#each unnamedPeople as person (person.id)}
                <button
                  type="button"
                  onclick={() => selectPerson(person)}
                  class="rounded-full p-1 transition-all hover:bg-subtle {selectedIds.has(person.id)
                    ? 'ring-2 ring-primary'
                    : ''}"
                >
                  <ImageThumbnail circle url={getPeopleThumbnailUrl(person)} altText={person.name} widthStyle="4rem" />
                </button>
              {/each}
            </div>
          {/if}

          {#if filteredPeople.length === 0}
            <Text size="small" color="muted" class="p-2">{$t('no_people_found')}</Text>
          {/if}
        </div>
      </div>

      <ModalFooter>
        <HStack fullWidth>
          <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
          <Button shape="round" fullWidth onclick={() => onClose(selectedPeople)}>
            {$t('save')}
          </Button>
        </HStack>
      </ModalFooter>
    {:else}
      <Text color="muted">{$t('no_people_found')}</Text>
    {/if}
  </ModalBody>
</Modal>
