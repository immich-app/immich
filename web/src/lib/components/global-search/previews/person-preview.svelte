<script lang="ts">
  import { createUrl, getAssetMediaUrl, getPeopleThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize, searchAssets, type AssetResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    person: PersonResponseDto & { numberOfAssets?: number };
  }
  let { person }: Props = $props();

  let photos = $state<AssetResponseDto[]>([]);
  let loaded = $state(false);
  let generation = 0;

  const thumbUrl = $derived(
    person.primaryProfile?.type === 'space-person' && person.primaryProfile.spaceId
      ? createUrl(`/shared-spaces/${person.primaryProfile.spaceId}/people/${person.primaryProfile.id}/thumbnail`, {
          updatedAt: person.updatedAt,
        })
      : getPeopleThumbnailUrl({ ...person, id: person.primaryProfile?.id ?? person.id }),
  );
  let failed = $state(false);
  // Reset failure when the person changes (preview is re-used as the user
  // arrows through the People section).
  $effect(() => {
    void person.id;
    failed = false;
  });

  $effect(() => {
    const gen = ++generation;
    const id = person.filterId ?? person.id;
    photos = [];
    loaded = false;
    const dwell = setTimeout(() => {
      // Wrap the async work in an IIFE so setTimeout's callback is synchronous.
      // ESLint's `no-misused-promises` flags async setTimeout callbacks because
      // setTimeout doesn't await the returned promise.
      void (async () => {
        const ctrl = new AbortController();
        try {
          const response = await searchAssets(
            { metadataSearchDto: { personIds: [id], size: 4, withSharedSpaces: true } },
            { signal: ctrl.signal },
          );
          if (gen !== generation) {
            return;
          }
          photos = response.assets.items;
        } catch {
          // ignore — preview is best-effort
        } finally {
          if (gen === generation) {
            loaded = true;
          }
        }
      })();
    }, 300);
    return () => clearTimeout(dwell);
  });
</script>

<div data-cmdk-preview-person class="flex flex-col items-center gap-3 p-5">
  {#if !failed}
    <img
      src={thumbUrl}
      alt={person.name ?? ''}
      class="h-[120px] w-[120px] rounded-full object-cover"
      onerror={() => (failed = true)}
    />
  {:else}
    <div class="h-[120px] w-[120px] rounded-full bg-subtle/40" aria-hidden="true"></div>
  {/if}
  <div class="text-center">
    <div class="text-lg font-semibold">{person.name || $t('cmdk_unnamed_person')}</div>
    {#if person.numberOfAssets !== undefined}
      <div class="text-xs font-normal text-gray-500 dark:text-gray-400">{person.numberOfAssets} photos</div>
    {/if}
  </div>
  {#if loaded && photos.length > 0}
    <div class="mt-2 flex gap-2">
      {#each photos as photo (photo.id)}
        <img
          src={getAssetMediaUrl({ id: photo.id, size: AssetMediaSize.Thumbnail })}
          alt=""
          class="h-12 w-12 rounded-md object-cover"
        />
      {/each}
    </div>
  {/if}
</div>
