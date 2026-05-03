<script lang="ts">
  import { createUrl, getPeopleThumbnailUrl } from '$lib/utils';
  import { type PersonResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    item: PersonResponseDto & { numberOfAssets?: number };
  }
  let { item }: Props = $props();

  const thumbUrl = $derived(
    item.primaryProfile?.type === 'space-person' && item.primaryProfile.spaceId
      ? createUrl(`/shared-spaces/${item.primaryProfile.spaceId}/people/${item.primaryProfile.id}/thumbnail`, {
          updatedAt: item.updatedAt,
        })
      : getPeopleThumbnailUrl({ ...item, id: item.primaryProfile?.id ?? item.id }),
  );
  let failed = $state(false);
  // Reset the failure flag whenever the row swaps to a different person — the
  // component instance is re-used by bits-ui as the user scrolls the list.
  $effect(() => {
    void item.id;
    failed = false;
  });
</script>

<div
  class="flex h-[52px] items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-[80ms] ease-out group-data-[selected]:bg-primary/10"
>
  {#if !failed}
    <img
      src={thumbUrl}
      alt=""
      class="h-10 w-10 rounded-full object-cover"
      loading="lazy"
      onerror={() => (failed = true)}
    />
  {:else}
    <div class="h-10 w-10 rounded-full bg-subtle/40" aria-hidden="true"></div>
  {/if}
  <div class="min-w-0 flex-1">
    <div class="truncate text-sm font-medium">{item.name || $t('cmdk_unnamed_person')}</div>
    {#if item.numberOfAssets !== undefined}
      <div class="text-xs text-gray-500 dark:text-gray-400">{item.numberOfAssets} photos</div>
    {/if}
  </div>
</div>
