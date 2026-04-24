<script lang="ts">
  import { Icon } from '@immich/ui';
  import { t, type Translations } from 'svelte-i18n';
  import type { RecentEntry } from '$lib/stores/cmdk-recent';
  import AlbumRow from './album-row.svelte';
  import PhotoRow from './photo-row.svelte';
  import PersonRow from './person-row.svelte';
  import PlaceRow from './place-row.svelte';
  import QueryRow from './query-row.svelte';
  import SpaceRow from './space-row.svelte';
  import TagRow from './tag-row.svelte';

  interface Props {
    entry: RecentEntry;
  }
  let { entry }: Props = $props();
</script>

{#if entry.kind === 'query'}
  <QueryRow {entry} />
{:else if entry.kind === 'photo'}
  <PhotoRow item={{ id: entry.assetId, originalFileName: entry.label } as never} />
{:else if entry.kind === 'person'}
  <PersonRow item={{ id: entry.personId, name: entry.label } as never} />
{:else if entry.kind === 'place'}
  <PlaceRow item={{ name: entry.label, latitude: entry.latitude, longitude: entry.longitude } as never} />
{:else if entry.kind === 'tag'}
  <TagRow item={{ id: entry.tagId, name: entry.label, color: null } as never} />
{:else if entry.kind === 'album'}
  <!-- RECENT stores a snapshot — full AlbumNameDto (shared/assetCount) isn't available, synthesize a minimal one. -->
  <AlbumRow
    item={{
      id: entry.albumId,
      albumName: entry.label,
      albumThumbnailAssetId: entry.thumbnailAssetId,
      shared: false,
      assetCount: 0,
    } as never}
    isPending={false}
  />
{:else if entry.kind === 'space'}
  <!-- RECENT stores a snapshot — full SharedSpaceResponseDto isn't available, synthesize a minimal one. -->
  <SpaceRow
    item={{
      id: entry.spaceId,
      name: entry.label,
      color: entry.colorHex,
      memberCount: 0,
      assetCount: 0,
      recentAssetIds: [],
    } as never}
    isPending={false}
  />
{:else if entry.kind === 'navigate'}
  <div
    class="flex h-[52px] items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-[80ms] ease-out group-data-[selected]:bg-primary/10"
  >
    <div class="flex h-8 w-8 items-center justify-center rounded-md bg-subtle/40">
      <Icon icon={entry.icon} size="1.125em" class="text-gray-500 dark:text-gray-400" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="truncate text-sm font-medium">{$t(entry.labelKey as Translations)}</div>
    </div>
  </div>
{/if}
