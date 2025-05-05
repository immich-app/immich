<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import PeopleInfiniteScroll from '$lib/components/faces-page/people-infinite-scroll.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { locale } from '$lib/stores/preferences.store';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updatePeople, type PersonResponseDto } from '@immich/sdk';
  import { mdiClose, mdiEye, mdiEyeOff, mdiEyeSettings, mdiRestart } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { ToggleVisibility } from '$lib/constants';

  interface Props {
    people: PersonResponseDto[];
    totalPeopleCount: number;
    titleId?: string | undefined;
    onClose: () => void;
    loadNextPage: () => void;
  }

  let { people = $bindable(), totalPeopleCount, titleId = undefined, onClose, loadNextPage }: Props = $props();

  let toggleVisibility = $state(ToggleVisibility.SHOW_ALL);
  let showLoadingSpinner = $state(false);

  const getPersonIsHidden = (people: PersonResponseDto[]) => {
    const personIsHidden: Record<string, boolean> = {};
    for (const person of people) {
      personIsHidden[person.id] = person.isHidden;
    }
    return personIsHidden;
  };

  const getNextVisibility = (toggleVisibility: ToggleVisibility) => {
    if (toggleVisibility === ToggleVisibility.SHOW_ALL) {
      return ToggleVisibility.HIDE_UNNANEMD;
    } else if (toggleVisibility === ToggleVisibility.HIDE_UNNANEMD) {
      return ToggleVisibility.HIDE_ALL;
    } else {
      return ToggleVisibility.SHOW_ALL;
    }
  };

  const handleToggleVisibility = () => {
    toggleVisibility = getNextVisibility(toggleVisibility);

    for (const person of people) {
      if (toggleVisibility === ToggleVisibility.HIDE_ALL) {
        personIsHidden[person.id] = true;
      } else if (toggleVisibility === ToggleVisibility.SHOW_ALL) {
        personIsHidden[person.id] = false;
      } else if (toggleVisibility === ToggleVisibility.HIDE_UNNANEMD && !person.name) {
        personIsHidden[person.id] = true;
      }
    }
  };

  const handleResetVisibility = () => (personIsHidden = getPersonIsHidden(people));

  const handleSaveVisibility = async () => {
    showLoadingSpinner = true;
    const changed = people
      .filter((person) => person.isHidden !== personIsHidden[person.id])
      .map((person) => ({ id: person.id, isHidden: personIsHidden[person.id] }));

    try {
      if (changed.length > 0) {
        const results = await updatePeople({ peopleUpdateDto: { people: changed } });
        const successCount = results.filter(({ success }) => success).length;
        const failCount = results.length - successCount;
        if (failCount > 0) {
          notificationController.show({
            type: NotificationType.Error,
            message: $t('errors.unable_to_change_visibility', { values: { count: failCount } }),
          });
        }
        notificationController.show({
          type: NotificationType.Info,
          message: $t('visibility_changed', { values: { count: successCount } }),
        });
      }

      for (const person of people) {
        person.isHidden = personIsHidden[person.id];
      }

      onClose();
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_visibility', { values: { count: changed.length } }));
    } finally {
      showLoadingSpinner = false;
    }
  };

  let personIsHidden = $state(getPersonIsHidden(people));

  let toggleButtonOptions: Record<ToggleVisibility, { icon: string; label: string }> = $derived({
    [ToggleVisibility.HIDE_ALL]: { icon: mdiEyeOff, label: $t('hide_all_people') },
    [ToggleVisibility.HIDE_UNNANEMD]: { icon: mdiEyeSettings, label: $t('hide_unnamed_people') },
    [ToggleVisibility.SHOW_ALL]: { icon: mdiEye, label: $t('show_all_people') },
  });
  let toggleButton = $derived(toggleButtonOptions[getNextVisibility(toggleVisibility)]);
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onClose }} />

<div
  class="fixed top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-white p-1 dark:border-immich-dark-gray dark:bg-black dark:text-immich-dark-fg md:p-8"
>
  <div class="flex items-center">
    <CircleIconButton title={$t('close')} icon={mdiClose} onclick={onClose} />
    <div class="flex gap-2 items-center">
      <p id={titleId} class="ms-2">{$t('show_and_hide_people')}</p>
      <p class="text-sm text-gray-400 dark:text-gray-600">({totalPeopleCount.toLocaleString($locale)})</p>
    </div>
  </div>
  <div class="flex items-center justify-end">
    <div class="flex items-center md:me-4">
      <CircleIconButton title={$t('reset_people_visibility')} icon={mdiRestart} onclick={handleResetVisibility} />
      <CircleIconButton title={toggleButton.label} icon={toggleButton.icon} onclick={handleToggleVisibility} />
    </div>
    {#if !showLoadingSpinner}
      <Button onclick={handleSaveVisibility} size="sm" rounded="lg">{$t('done')}</Button>
    {:else}
      <LoadingSpinner />
    {/if}
  </div>
</div>

<div class="flex flex-wrap gap-1 bg-immich-bg p-2 pb-8 dark:bg-immich-dark-bg md:px-8 mt-16">
  <PeopleInfiniteScroll {people} hasNextPage={true} {loadNextPage}>
    {#snippet children({ person })}
      {@const hidden = personIsHidden[person.id]}
      <button
        type="button"
        class="group relative w-full h-full"
        onclick={() => (personIsHidden[person.id] = !hidden)}
        aria-pressed={hidden}
        aria-label={person.name ? $t('hide_named_person', { values: { name: person.name } }) : $t('hide_person')}
      >
        <ImageThumbnail
          {hidden}
          shadow
          url={getPeopleThumbnailUrl(person)}
          altText={person.name}
          widthStyle="100%"
          hiddenIconClass="text-white group-hover:text-black transition-colors"
        />
        {#if person.name}
          <span class="absolute bottom-2 start-0 w-full select-text px-1 text-center font-medium text-white">
            {person.name}
          </span>
        {/if}
      </button>
    {/snippet}
  </PeopleInfiniteScroll>
</div>
