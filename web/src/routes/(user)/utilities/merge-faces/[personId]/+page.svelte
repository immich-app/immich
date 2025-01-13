<script lang="ts">
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { AppRoute } from '$lib/constants';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { t } from 'svelte-i18n';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { mergePerson } from '@immich/sdk';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { goto } from '$app/navigation';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiCheckCircle } from '@mdi/js';
  import { SvelteSet } from 'svelte/reactivity';

  let selectedPeople = new SvelteSet<string>();

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  const clearSelection = () => {
    selectedPeople.clear();
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSelection();
    }
  };

  const toggleSelection = (personId: string) => {
    if (selectedPeople.has(personId)) {
      selectedPeople.delete(personId);
    } else {
      selectedPeople.add(personId);
    }
  };

  const handleMerge = async () => {
    if (selectedPeople.size === 0) {
      return;
    }

    try {
      await mergePerson({
        id: $page.params.personId,
        mergePersonDto: { ids: Array.from(selectedPeople) },
      });

      notificationController.show({
        message: $t('merge_people_utility_success', {
          values: {
            count: selectedPeople.size,
            name: data.person.name,
          },
        }),
        type: NotificationType.Info,
      });

      await goto(AppRoute.MERGE_FACES);
    } catch {
      notificationController.show({
        message: $t('errors.unable_to_merge_people'),
        type: NotificationType.Error,
      });
    }
  };
</script>

<svelte:window onkeydown={handleKeydown} />

<UserPageLayout title={$t('choose_faces_to_merge', { values: { name: data.person.name } })}>
  {#snippet buttons()}
    <div class="flex justify-end px-4">
      <Button disabled={selectedPeople.size === 0} onclick={handleMerge} size="sm">
        {$t('merge_selected', { values: { count: selectedPeople.size, person: data.person.name } })}
      </Button>
    </div>
  {/snippet}
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap gap-1 p-4">
      {#each data.similarPeople as person, index}
        <div
          class="flex-1 aspect-square min-w-48 group relative focus-visible:outline-none flex overflow-hidden bg-immich-primary/20 dark:bg-immich-dark-primary/20"
          onclick={() => selectedPeople.size > 0 && toggleSelection(person.id)}
          onkeypress={(e) => selectedPeople.size > 0 && e.key === 'Enter' && toggleSelection(person.id)}
          role="button"
          tabindex="0"
        >
          <div
            class="absolute h-full w-full select-none bg-transparent transition-transform"
            class:scale-[0.85]={selectedPeople.has(person.id)}
            class:rounded-xl={selectedPeople.has(person.id)}
          >
            <ImageThumbnail
              preload={index < 20}
              shadow
              url={getPeopleThumbnailUrl(person)}
              altText={person.name}
              widthStyle="100%"
              hiddenIconClass="text-white group-hover:text-black transition-colors"
              curve={selectedPeople.has(person.id)}
            />
            {#if selectedPeople.size === 0}
              <a href="{AppRoute.PEOPLE}/{person.id}" class="absolute inset-0" aria-label="View {person.name}">
                <div
                  class="absolute z-10 inset-0 bg-gradient-to-b from-black/25 via-[transparent_25%] opacity-0 transition-opacity group-hover:opacity-100"
                ></div>
              </a>
            {:else}
              <div
                class="absolute z-10 inset-0 bg-gradient-to-b from-black/25 via-[transparent_25%] opacity-0 transition-opacity group-hover:opacity-100"
              ></div>
            {/if}
          </div>

          {#if selectedPeople.has(person.id)}
            <button
              type="button"
              onclick={(e) => {
                e.stopPropagation();
                toggleSelection(person.id);
              }}
              class="z-50 absolute top-2 left-2 p-2 focus:outline-none"
              role="checkbox"
              aria-checked={true}
              aria-label="Deselect {person.name}"
            >
              <div class="rounded-full bg-[#D9DCEF] dark:bg-[#232932]">
                <Icon path={mdiCheckCircle} size="24" class="text-immich-primary" />
              </div>
            </button>
          {:else}
            <button
              type="button"
              onclick={(e) => {
                e.stopPropagation();
                toggleSelection(person.id);
              }}
              class="z-50 absolute top-2 left-2 p-2 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
              role="checkbox"
              aria-checked={false}
              aria-label="Select {person.name}"
            >
              <Icon path={mdiCheckCircle} size="24" class="text-white/80 hover:text-white" />
            </button>
          {/if}

          {#if person.name}
            <span class="absolute bottom-2 left-0 w-full select-text px-1 text-center font-medium text-white">
              {person.name}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</UserPageLayout>
