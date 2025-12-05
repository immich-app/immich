<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { Button, HStack, LoadingSpinner, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    multiple?: boolean;
    excludedIds?: string[];
    onClose: (people?: PersonResponseDto[]) => void;
  };

  let { multiple = false, excludedIds = [], onClose }: Props = $props();

  let people: PersonResponseDto[] = $state([]);
  let loading = $state(true);
  let searchName = $state('');
  let selectedPeople: PersonResponseDto[] = $state([]);

  const filteredPeople = $derived(
    people
      .filter((person) => !excludedIds.includes(person.id))
      .filter((person) => !searchName || person.name.toLowerCase().includes(searchName.toLowerCase())),
  );

  onMount(async () => {
    try {
      loading = true;
      const result = await getAllPeople({ withHidden: false });
      people = result.people;
      loading = false;
    } catch (error) {
      handleError(error, $t('get_people_error'));
    }
  });

  const togglePerson = (person: PersonResponseDto) => {
    if (multiple) {
      const index = selectedPeople.findIndex((p) => p.id === person.id);
      selectedPeople = index === -1 ? [...selectedPeople, person] : selectedPeople.filter((p) => p.id !== person.id);
    } else {
      onClose([person]);
    }
  };

  const handleSubmit = () => {
    if (selectedPeople.length > 0) {
      onClose(selectedPeople);
    } else {
      onClose();
    }
  };
</script>

<Modal title={multiple ? $t('select_people') : $t('select_person')} {onClose} size="small">
  <ModalBody>
    <div class="flex flex-col gap-4">
      <SearchBar bind:name={searchName} placeholder={$t('search_people')} showLoadingSpinner={false} />

      <div class="immich-scrollbar max-h-96 overflow-y-auto">
        {#if loading}
          <div class="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        {:else if filteredPeople.length > 0}
          <div class="grid grid-cols-3 gap-4 p-2">
            {#each filteredPeople as person (person.id)}
              {@const isSelected = selectedPeople.some((p) => p.id === person.id)}
              <button
                type="button"
                onclick={() => togglePerson(person)}
                class="flex flex-col items-center gap-2 rounded-xl p-2 transition-all hover:bg-subtle {isSelected
                  ? 'bg-primary/10 ring-2 ring-primary'
                  : ''}"
              >
                <ImageThumbnail
                  circle
                  shadow
                  url={getPeopleThumbnailUrl(person)}
                  altText={person.name}
                  widthStyle="100%"
                />
                <p class="line-clamp-2 text-center text-sm font-medium">{person.name}</p>
              </button>
            {/each}
          </div>
        {:else}
          <p class="py-8 text-center text-sm text-gray-500">{$t('no_people_found')}</p>
        {/if}
      </div>
    </div>
  </ModalBody>

  {#if multiple}
    <ModalFooter>
      <HStack fullWidth gap={4}>
        <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
        <Button shape="round" fullWidth onclick={handleSubmit} disabled={selectedPeople.length === 0}>
          {$t('select_count', { values: { count: selectedPeople.length } })}
        </Button>
      </HStack>
    </ModalFooter>
  {/if}
</Modal>
