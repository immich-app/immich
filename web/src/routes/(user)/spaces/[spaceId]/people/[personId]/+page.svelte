<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { createUrl, getAssetMediaUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    mergeSpacePeople,
    Role,
    type SharedSpaceMemberResponseDto,
    type SharedSpacePersonResponseDto,
    type SharedSpaceResponseDto,
  } from '@immich/sdk';
  import { Icon, IconButton, toastManager } from '@immich/ui';
  import { mdiAccountMultipleCheckOutline, mdiArrowLeft, mdiCheck } from '@mdi/js';
  import { user } from '$lib/stores/user.store';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let space: SharedSpaceResponseDto = $state(data.space);
  let members: SharedSpaceMemberResponseDto[] = $state(data.members);
  let person: SharedSpacePersonResponseDto = $state(data.person);
  let assetIds: string[] = $state(data.assetIds);
  let allPeople: SharedSpacePersonResponseDto[] = $state(data.allPeople);
  let action = $state<string | null>(data.action);

  let mergeTargetId = $state<string | null>(null);

  const currentMember = $derived(members.find((m) => m.userId === $user.id));
  const isEditor = $derived(currentMember?.role === Role.Owner || currentMember?.role === Role.Editor);

  const displayName = $derived(person.alias || person.name || '');

  const otherPeople = $derived(allPeople.filter((p) => p.id !== person.id));

  const getThumbUrl = (p: SharedSpacePersonResponseDto): string => {
    return createUrl(`/shared-spaces/${space.id}/people/${p.id}/thumbnail`, { updatedAt: p.updatedAt });
  };

  const getOtherDisplayName = (p: SharedSpacePersonResponseDto): string => {
    return p.alias || p.name || '';
  };

  async function handleMerge() {
    if (!mergeTargetId) {
      return;
    }

    try {
      await mergeSpacePeople({
        id: space.id,
        personId: mergeTargetId,
        sharedSpacePersonMergeDto: { ids: [person.id] },
      });
      toastManager.success($t('spaces_people_merged'));
      void goto(`/spaces/${space.id}/people`);
    } catch (error) {
      handleError(error, $t('spaces_error_merging_people'));
    }
  }

  function cancelMerge() {
    action = null;
    mergeTargetId = null;
  }
</script>

<UserPageLayout title={displayName}>
  {#snippet leading()}
    <IconButton
      variant="ghost"
      shape="round"
      color="secondary"
      aria-label={$t('back')}
      onclick={() => goto(`/spaces/${space.id}/people`)}
      icon={mdiArrowLeft}
    />
  {/snippet}

  {#snippet buttons()}
    {#if isEditor && action !== 'merge'}
      <button
        type="button"
        class="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        onclick={() => (action = 'merge')}
        data-testid="start-merge-button"
      >
        <Icon icon={mdiAccountMultipleCheckOutline} size="16" />
        {$t('merge_people')}
      </button>
    {/if}
  {/snippet}

  {#if action === 'merge'}
    <!-- Merge flow -->
    <section class="px-4 pt-4">
      <div class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <h2 class="text-lg font-semibold">{$t('spaces_merge_people')}</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {$t('spaces_merge_description', { values: { name: displayName } })}
        </p>

        <div class="mt-4 flex items-center gap-3">
          <div class="size-16 overflow-hidden rounded-full">
            <img src={getThumbUrl(person)} alt={displayName} class="size-full object-cover" />
          </div>
          <div>
            <p class="font-medium">{displayName}</p>
            <p class="text-xs text-gray-500">
              {person.assetCount}
              {$t('photos')} · {person.faceCount}
              {$t('spaces_faces')}
            </p>
          </div>
        </div>
      </div>

      <h3 class="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
        {$t('spaces_merge_into')}
      </h3>

      {#if otherPeople.length === 0}
        <p class="py-4 text-center text-sm text-gray-500">{$t('spaces_no_other_people')}</p>
      {:else}
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {#each otherPeople as other (other.id)}
            <button
              type="button"
              class="relative overflow-hidden rounded-xl border-2 transition-colors
                {mergeTargetId === other.id
                ? 'border-immich-primary bg-immich-primary/5'
                : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}"
              onclick={() => (mergeTargetId = other.id)}
              data-testid="merge-target-{other.id}"
            >
              <img
                src={getThumbUrl(other)}
                alt={getOtherDisplayName(other)}
                class="aspect-square w-full object-cover"
                loading="lazy"
              />
              <div class="p-2">
                <p class="truncate text-sm font-medium">{getOtherDisplayName(other)}</p>
                <p class="text-xs text-gray-400">{other.assetCount} {$t('photos')}</p>
              </div>

              {#if mergeTargetId === other.id}
                <div class="absolute right-2 top-2 rounded-full bg-immich-primary p-1 text-white">
                  <Icon icon={mdiCheck} size="14" />
                </div>
              {/if}
            </button>
          {/each}
        </div>
      {/if}

      <div class="mt-6 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          onclick={cancelMerge}
        >
          {$t('cancel')}
        </button>
        <button
          type="button"
          class="rounded-lg bg-immich-primary px-4 py-2 text-sm font-medium text-white hover:bg-immich-primary/90 disabled:opacity-50"
          onclick={handleMerge}
          disabled={!mergeTargetId}
          data-testid="confirm-merge-button"
        >
          {$t('spaces_confirm_merge')}
        </button>
      </div>
    </section>
  {:else}
    <!-- Person detail: asset grid -->
    <section class="px-4 pt-4">
      <div class="mb-4 flex items-center gap-4">
        <div class="size-20 overflow-hidden rounded-full">
          <img src={getThumbUrl(person)} alt={displayName} class="size-full object-cover" />
        </div>
        <div>
          <h2 class="text-xl font-bold">{displayName}</h2>
          {#if person.alias && person.name}
            <p class="text-sm text-gray-500 dark:text-gray-400">{person.name}</p>
          {/if}
          <p class="text-sm text-gray-400 dark:text-gray-500">
            {person.assetCount}
            {$t('photos')}
          </p>
        </div>
      </div>

      {#if assetIds.length === 0}
        <div class="py-8 text-center">
          <p class="text-gray-500 dark:text-gray-400">{$t('spaces_no_person_assets')}</p>
        </div>
      {:else}
        <div class="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {#each assetIds as assetId (assetId)}
            <a
              href="/spaces/{space.id}/photos/{assetId}"
              class="aspect-square overflow-hidden rounded-sm"
              data-testid="person-asset-{assetId}"
            >
              <img
                src={getAssetMediaUrl({ id: assetId })}
                alt=""
                class="size-full object-cover transition-transform duration-200 hover:scale-105"
                loading="lazy"
              />
            </a>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</UserPageLayout>
