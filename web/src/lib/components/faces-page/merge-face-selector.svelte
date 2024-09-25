<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Icon from '$lib/components/elements/icon.svelte';
  import { ActionQueryParameterValue, AppRoute, QueryParameter } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllPeople, getPerson, mergePerson, type PersonResponseDto } from '@immich/sdk';
  import { mdiCallMerge, mdiMerge, mdiSwapHorizontal } from '@mdi/js';
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import Button from '../elements/buttons/button.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import FaceThumbnail from './face-thumbnail.svelte';
  import PeopleList from './people-list.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import { t } from 'svelte-i18n';

  export let person: PersonResponseDto;
  export let onBack: () => void;
  export let onMerge: (mergedPerson: PersonResponseDto) => void;

  let people: PersonResponseDto[] = [];
  let selectedPeople: PersonResponseDto[] = [];
  let screenHeight: number;

  $: hasSelection = selectedPeople.length > 0;
  $: peopleToNotShow = [...selectedPeople, person];

  onMount(async () => {
    const data = await getAllPeople({ withHidden: false });
    people = data.people;
  });

  const handleSwapPeople = async () => {
    [person, selectedPeople[0]] = [selectedPeople[0], person];
    $page.url.searchParams.set(QueryParameter.ACTION, ActionQueryParameterValue.MERGE);
    await goto(`${AppRoute.PEOPLE}/${person.id}?${$page.url.searchParams.toString()}`);
  };

  const onSelect = async (selected: PersonResponseDto) => {
    if (selectedPeople.includes(selected)) {
      selectedPeople = selectedPeople.filter((person) => person.id !== selected.id);
      return;
    }

    if (selectedPeople.length >= 5) {
      notificationController.show({
        message: $t('merge_people_limit'),
        type: NotificationType.Info,
      });
      return;
    }

    selectedPeople = [selected, ...selectedPeople];

    if (selectedPeople.length === 1 && !person.name && selected.name) {
      await handleSwapPeople();
    }
  };

  const handleMerge = async () => {
    const isConfirm = await dialogController.show({
      prompt: $t('merge_people_prompt'),
    });

    if (!isConfirm) {
      return;
    }

    try {
      let results = await mergePerson({
        id: person.id,
        mergePersonDto: { ids: selectedPeople.map(({ id }) => id) },
      });
      const mergedPerson = await getPerson({ id: person.id });
      const count = results.filter(({ success }) => success).length;
      notificationController.show({
        message: $t('merged_people_count', { values: { count } }),
        type: NotificationType.Info,
      });
      onMerge(mergedPerson);
    } catch (error) {
      handleError(error, $t('cannot_merge_people'));
    }
  };
</script>

<svelte:window bind:innerHeight={screenHeight} />

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg dark:bg-immich-dark-bg"
>
  <ControlAppBar onClose={onBack}>
    <svelte:fragment slot="leading">
      {#if hasSelection}
        {$t('selected_count', { values: { count: selectedPeople.length } })}
      {:else}
        {$t('merge_people')}
      {/if}
      <div />
    </svelte:fragment>
    <svelte:fragment slot="trailing">
      <Button size={'sm'} disabled={!hasSelection} on:click={handleMerge}>
        <Icon path={mdiMerge} size={18} />
        <span class="ml-2">{$t('merge')}</span></Button
      >
    </svelte:fragment>
  </ControlAppBar>
  <section class="bg-immich-bg px-[70px] pt-[100px] dark:bg-immich-dark-bg">
    <section id="merge-face-selector relative">
      <div class="mb-10 h-[200px] place-content-center place-items-center">
        <p class="mb-4 text-center uppercase dark:text-white">{$t('choose_matching_people_to_merge')}</p>

        <div class="grid grid-flow-col-dense place-content-center place-items-center gap-4">
          {#each selectedPeople as person (person.id)}
            <div animate:flip={{ duration: 250, easing: quintOut }}>
              <FaceThumbnail border circle {person} selectable thumbnailSize={120} onClick={() => onSelect(person)} />
            </div>
          {/each}

          {#if hasSelection}
            <div class="relative h-full">
              <div class="flex flex-col h-full justify-between">
                <div class="flex h-full items-center justify-center">
                  <Icon path={mdiCallMerge} size={48} class="rotate-90 dark:text-white" />
                </div>
                {#if selectedPeople.length === 1}
                  <div class="absolute bottom-2">
                    <CircleIconButton
                      title={$t('swap_merge_direction')}
                      icon={mdiSwapHorizontal}
                      size="24"
                      on:click={handleSwapPeople}
                    />
                  </div>
                {/if}
              </div>
            </div>
          {/if}
          <FaceThumbnail {person} border circle selectable={false} thumbnailSize={180} />
        </div>
      </div>

      <PeopleList {people} {peopleToNotShow} {screenHeight} {onSelect} />
    </section>
  </section>
</section>
