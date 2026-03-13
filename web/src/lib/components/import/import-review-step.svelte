<script lang="ts">
  import type { ImportOptions } from '$lib/managers/import-manager.svelte';
  import type { TakeoutAlbum, TakeoutMediaItem } from '$lib/utils/google-takeout-parser';
  import { Button, Checkbox, Icon, Switch } from '@immich/ui';
  import {
    mdiAlertOutline,
    mdiArchive,
    mdiArrowLeft,
    mdiCalendar,
    mdiContentCopy,
    mdiImage,
    mdiMapMarker,
    mdiStar,
    mdiTextBox,
    mdiUpload,
    mdiVideo,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    items: TakeoutMediaItem[];
    albums: TakeoutAlbum[];
    selectedAlbums: Set<string>;
    options: ImportOptions;
    stats: {
      withLocation: number;
      withDate: number;
      favorites: number;
      archived: number;
      dateRange?: { earliest: Date; latest: Date };
    };
    onToggleAlbum: (name: string) => void;
    onSelectAllAlbums: () => void;
    onDeselectAllAlbums: () => void;
    onSetOption: (key: string, value: boolean) => void;
    onImport: () => void;
    onBack: () => void;
  }

  let {
    items,
    albums,
    selectedAlbums,
    options,
    stats,
    onToggleAlbum,
    onSelectAllAlbums,
    onDeselectAllAlbums,
    onSetOption,
    onImport,
    onBack,
  }: Props = $props();

  const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp', '.mts', '.m2ts']);

  let photoCount = $derived(
    items.filter((item) => {
      const ext = item.path.slice(Math.max(0, item.path.lastIndexOf('.'))).toLowerCase();
      return !VIDEO_EXTENSIONS.has(ext);
    }).length,
  );

  let videoCount = $derived(items.length - photoCount);

  let missingDates = $derived(items.length - stats.withDate);

  function formatDate(date: Date): string {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
</script>

<div class="flex flex-col gap-6">
  <!-- Summary card -->
  <div class="rounded-xl border border-gray-200 p-6 dark:border-gray-700">
    <h3 class="mb-4 text-lg font-medium">{$t('import_step_review')}</h3>
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <div class="flex flex-col items-center gap-1">
        <Icon icon={mdiImage} size="20" class="text-primary" />
        <span class="text-lg font-semibold">{photoCount}</span>
        <span class="text-xs text-gray-500">{$t('photos')}</span>
      </div>
      <div class="flex flex-col items-center gap-1">
        <Icon icon={mdiVideo} size="20" class="text-purple-500" />
        <span class="text-lg font-semibold">{videoCount}</span>
        <span class="text-xs text-gray-500">{$t('videos')}</span>
      </div>
      <div class="flex flex-col items-center gap-1">
        <Icon icon={mdiMapMarker} size="20" class="text-green-500" />
        <span class="text-lg font-semibold">{stats.withLocation}</span>
        <span class="text-xs text-gray-500">{$t('location')}</span>
      </div>
      <div class="flex flex-col items-center gap-1">
        <Icon icon={mdiStar} size="20" class="text-yellow-500" />
        <span class="text-lg font-semibold">{stats.favorites}</span>
        <span class="text-xs text-gray-500">{$t('favorites')}</span>
      </div>
      <div class="flex flex-col items-center gap-1">
        <Icon icon={mdiArchive} size="20" class="text-gray-500" />
        <span class="text-lg font-semibold">{stats.archived}</span>
        <span class="text-xs text-gray-500">{$t('archived')}</span>
      </div>
      {#if stats.dateRange}
        <div class="flex flex-col items-center gap-1">
          <Icon icon={mdiCalendar} size="20" class="text-blue-500" />
          <span class="text-xs font-medium">{formatDate(stats.dateRange.earliest)}</span>
          <span class="text-xs text-gray-500">— {formatDate(stats.dateRange.latest)}</span>
        </div>
      {/if}
    </div>

    {#if missingDates > 0}
      <div
        class="mt-4 flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
      >
        <Icon icon={mdiAlertOutline} size="18" class="shrink-0" />
        <span>{$t('import_missing_dates_warning', { values: { count: missingDates } })}</span>
      </div>
    {/if}
  </div>

  <!-- Albums card -->
  <div data-testid="albums-section" class="rounded-xl border border-gray-200 p-6 dark:border-gray-700">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-medium">
        {$t('albums')} ({selectedAlbums.size} / {albums.length})
      </h3>
      <div class="flex gap-2">
        <Button variant="ghost" size="small" onclick={onSelectAllAlbums}>
          {$t('import_select_all')}
        </Button>
        <Button variant="ghost" size="small" onclick={onDeselectAllAlbums}>
          {$t('import_deselect_all')}
        </Button>
      </div>
    </div>
    <div class="max-h-64 overflow-y-auto">
      {#each albums as album (album.name)}
        <div
          data-testid="album-{album.name}"
          class="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800
            {album.isAutoGenerated ? 'opacity-60' : ''}"
        >
          <Checkbox checked={selectedAlbums.has(album.name)} onCheckedChange={() => onToggleAlbum(album.name)} />
          <div class="flex-1">
            <span class="text-sm">{album.name}</span>
            <span class="ml-2 text-xs text-gray-400">({album.itemCount})</span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Options card -->
  <div class="rounded-xl border border-gray-200 p-6 dark:border-gray-700">
    <h3 class="mb-4 text-lg font-medium">{$t('import_options')}</h3>
    <div class="flex flex-col gap-4">
      <label class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon icon={mdiStar} size="18" class="text-yellow-500" />
          <span class="text-sm">{$t('import_option_favorites')}</span>
        </div>
        <Switch checked={options.importFavorites} onCheckedChange={(v) => onSetOption('importFavorites', v)} />
      </label>
      <label class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon icon={mdiArchive} size="18" class="text-gray-500" />
          <span class="text-sm">{$t('import_option_archived')}</span>
        </div>
        <Switch checked={options.importArchived} onCheckedChange={(v) => onSetOption('importArchived', v)} />
      </label>
      <label class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon icon={mdiTextBox} size="18" class="text-blue-500" />
          <span class="text-sm">{$t('import_option_descriptions')}</span>
        </div>
        <Switch checked={options.importDescriptions} onCheckedChange={(v) => onSetOption('importDescriptions', v)} />
      </label>
      <label class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon icon={mdiContentCopy} size="18" class="text-orange-500" />
          <span class="text-sm">{$t('import_option_skip_duplicates')}</span>
        </div>
        <Switch checked={options.skipDuplicates} onCheckedChange={(v) => onSetOption('skipDuplicates', v)} />
      </label>
    </div>
  </div>

  <!-- Navigation -->
  <div class="flex justify-between">
    <Button variant="outline" leadingIcon={mdiArrowLeft} onclick={onBack}>
      {$t('back')}
    </Button>
    <Button data-testid="import-button" leadingIcon={mdiUpload} onclick={onImport}>
      {$t('import_start', { values: { count: items.length } })}
    </Button>
  </div>
</div>
