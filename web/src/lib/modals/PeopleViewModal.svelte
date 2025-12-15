<script lang="ts">
  import PeopleList from '$lib/components/faces-page/people-list.svelte';
  import type { PersonResponseDto } from '@immich/sdk';
  import { Modal, ModalBody, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    people: PersonResponseDto[];
    peopleToNotShow: PersonResponseDto[];
    screenHeight: number;
    onClose: (people: PersonResponseDto[]) => void;
  };

  let { people, peopleToNotShow, screenHeight, onClose }: Props = $props();

  const onSelect = (selected: PersonResponseDto) => {
    people = people.filter((person) => person.id !== selected.id);
  };
</script>

<Modal title={$t('selected_people_to_merge')} size="full" onClose={() => onClose(people)}>
  <ModalBody>
    <Text class="text-center">{$t('choose_people_to_unselect')}</Text>
    <PeopleList {people} {peopleToNotShow} {screenHeight} {onSelect} />
  </ModalBody>
</Modal>
