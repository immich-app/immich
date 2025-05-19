<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { mergePerson, type PersonResponseDto } from '@immich/sdk';
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiArrowLeft, mdiMerge } from '@mdi/js';
  import { onMount, tick } from 'svelte';
  import { t } from 'svelte-i18n';
  import ImageThumbnail from '../components/assets/thumbnail/image-thumbnail.svelte';
  import CircleIconButton from '../components/elements/buttons/circle-icon-button.svelte';

  interface Props {
    personToMerge: PersonResponseDto;
    personToBeMergedInto: PersonResponseDto;
    potentialMergePeople: PersonResponseDto[];
    onClose: (people?: [PersonResponseDto, PersonResponseDto]) => void;
  }

  let {
    personToMerge = $bindable(),
    personToBeMergedInto = $bindable(),
    potentialMergePeople = $bindable(),
    onClose,
  }: Props = $props();

  let choosePersonToMerge = $state(false);

  const title = personToBeMergedInto.name;

  const changePersonToMerge = (newPerson: PersonResponseDto) => {
    const index = potentialMergePeople.indexOf(newPerson);
    [potentialMergePeople[index], personToBeMergedInto] = [personToBeMergedInto, potentialMergePeople[index]];
    choosePersonToMerge = false;
  };

  const handleMergePerson = async () => {
    try {
      await mergePerson({
        id: personToBeMergedInto.id,
        mergePersonDto: { ids: [personToMerge.id] },
      });

      notificationController.show({
        message: $t('merge_people_successfully'),
        type: NotificationType.Info,
      });
      onClose([personToMerge, personToBeMergedInto]);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_name'));
    }
  };

  onMount(async () => {
    await tick();
    document.querySelector<HTMLElement>('#merge-confirm-button')?.focus();
  });
</script>

<Modal title="{$t('merge_people')} - {title}" {onClose}>
  <ModalBody>
    <div class="flex items-center justify-center py-4 md:h-36 md:py-4">
      {#if !choosePersonToMerge}
        <div class="flex h-20 w-20 items-center px-1 md:h-24 md:w-24 md:px-2">
          <ImageThumbnail
            circle
            shadow
            url={getPeopleThumbnailUrl(personToMerge)}
            altText={personToMerge.name}
            widthStyle="100%"
          />
        </div>
        <div class="mx-0.5 flex md:mx-2">
          <CircleIconButton
            title={$t('swap_merge_direction')}
            icon={mdiMerge}
            onclick={() => ([personToMerge, personToBeMergedInto] = [personToBeMergedInto, personToMerge])}
          />
        </div>

        <button
          type="button"
          disabled={potentialMergePeople.length === 0}
          class="flex h-28 w-28 items-center rounded-full border-2 border-immich-primary px-1 dark:border-immich-dark-primary md:h-32 md:w-32 md:px-2"
          onclick={() => {
            if (potentialMergePeople.length > 0) {
              choosePersonToMerge = !choosePersonToMerge;
            }
          }}
        >
          <ImageThumbnail
            border={potentialMergePeople.length > 0}
            circle
            shadow
            url={getPeopleThumbnailUrl(personToBeMergedInto)}
            altText={personToBeMergedInto.name}
            widthStyle="100%"
          />
        </button>
      {:else}
        <div class="grid w-full grid-cols-1 gap-2">
          <div class="px-2">
            <button type="button" onclick={() => (choosePersonToMerge = false)}> <Icon path={mdiArrowLeft} /></button>
          </div>
          <div class="flex items-center justify-center">
            <div class="flex flex-wrap justify-center md:grid md:grid-cols-{potentialMergePeople.length}">
              {#each potentialMergePeople as person (person.id)}
                <div class="h-24 w-24 md:h-28 md:w-28">
                  <button type="button" class="p-2 w-full" onclick={() => changePersonToMerge(person)}>
                    <ImageThumbnail
                      border={true}
                      circle
                      shadow
                      url={getPeopleThumbnailUrl(person)}
                      altText={person.name}
                      widthStyle="100%"
                    />
                  </button>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="flex px-4 md:pt-4">
      <h1 class="text-xl text-gray-500 dark:text-gray-300">{$t('are_these_the_same_person')}</h1>
    </div>
    <div class="flex px-4 pt-2">
      <p class="text-sm text-gray-500 dark:text-gray-300">{$t('they_will_be_merged_together')}</p>
    </div>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-3 w-full">
      <Button fullWidth shape="round" color="secondary" onclick={() => onClose()}>{$t('no')}</Button>
      <Button id="merge-confirm-button" fullWidth shape="round" onclick={handleMergePerson}>
        {$t('yes')}
      </Button>
    </div>
  </ModalFooter>
</Modal>
