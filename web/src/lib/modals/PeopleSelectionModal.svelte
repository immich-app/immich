<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import { type PersonResponseDto } from '@immich/sdk';
  import { Button, HStack, ListButton, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    people: PersonResponseDto[];
    onClose: (people?: PersonResponseDto[]) => void;
  };

  let { people, onClose }: Props = $props();

  let searchName = $state('');
  let selectedPeople: PersonResponseDto[] = $state([]);

  const filteredPeople = $derived(
    people.filter(({ name }) => !searchName || normalizeSearchString(name).includes(normalizeSearchString(searchName))),
  );
  const namedPeople = $derived(filteredPeople.filter(({ name }) => name));
  const unnamedPeople = $derived(filteredPeople.filter(({ name }) => !name));

  const isSelected = (person: PersonResponseDto) => selectedPeople.some(({ id }) => id === person.id);

  const selectPerson = (person: PersonResponseDto) => {
    selectedPeople = selectedPeople.some(({ id }) => id === person.id)
      ? selectedPeople.filter(({ id }) => id !== person.id)
      : [...selectedPeople, person];
  };
</script>

<Modal title={$t('add_people')} {onClose} size="small">
  <ModalBody>
    {#if people.length > 0}
      <div class="flex flex-col gap-4">
        <SearchBar bind:name={searchName} placeholder={$t('search_people')} showLoadingSpinner={false} />

        <div class="flex max-h-75 immich-scrollbar flex-col gap-2 overflow-y-auto">
          {#each namedPeople as person (person.id)}
            <ListButton onclick={() => selectPerson(person)} selected={isSelected(person)}>
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
                  class="rounded-full p-1 transition-all hover:bg-subtle {isSelected(person)
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
          <Button
            shape="round"
            color="secondary"
            fullWidth
            onclick={() => (selectedPeople = people)}
            disabled={selectedPeople.length === people.length}
          >
            {$t('select_all')}
          </Button>
          <Button
            shape="round"
            fullWidth
            onclick={() => onClose(selectedPeople)}
            disabled={selectedPeople.length === 0}
          >
            {$t('add')}
          </Button>
        </HStack>
      </ModalFooter>
    {:else}
      <Text color="muted">{$t('no_people_found')}</Text>
    {/if}
  </ModalBody>
</Modal>
