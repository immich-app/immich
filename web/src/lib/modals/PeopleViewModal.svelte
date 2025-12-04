<script lang="ts">
  import { Modal, ModalBody } from "@immich/ui";
  import PeopleList from "$lib/components/faces-page/people-list.svelte";
  import { t } from 'svelte-i18n';
  import type { PersonResponseDto } from '@immich/sdk';

  interface Props {
    people: PersonResponseDto[];
    peopleToNotShow: PersonResponseDto[];
    screenHeight: number;
    onClose: (people: PersonResponseDto[]) => void;
  }

  let { people, peopleToNotShow, screenHeight, onClose }: Props = $props();

  // Hides the selected person.
  const onSelect = (selected: PersonResponseDto) => {
    if (people.includes(selected)) {
      people = people.filter((person) => person.id !== selected.id);
      return;
    }
  };

</script>

<Modal title={$t('selected_people_to_merge')} size="full" onClose={() => onClose(people)}>
  <ModalBody>
    <p class="mb-4 text-center dark:text-white">{$t('choose_people_to_unselect')}</p>
    <PeopleList {people} {peopleToNotShow} {screenHeight} {onSelect} />
  </ModalBody>
</Modal>
