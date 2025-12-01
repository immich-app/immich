<script lang="ts">
  import { Modal, ModalBody } from "@immich/ui";
  import PeopleList from "$lib/components/faces-page/people-list.svelte";
  import { t } from 'svelte-i18n';
  import type { PersonResponseDto } from '@immich/sdk';

  interface Props {
    people: PersonResponseDto[];
    peopleToNotShow: PersonResponseDto[];
    screenHeight: number;
    onSelect: (person: PersonResponseDto) => void;
    onClose: () => void;
  }

  let { people, peopleToNotShow, screenHeight, onSelect, onClose }: Props = $props();

</script>

<Modal title={$t('selected_people_to_merge')} size="full" {onClose}>
  <ModalBody>
    <p class="mb-4 text-center dark:text-white">{$t('choose_people_to_unselect')}</p>
    <PeopleList {people} {peopleToNotShow} {screenHeight} {onSelect} />
  </ModalBody>
</Modal>
