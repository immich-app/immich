<script lang="ts">
  import CalendarHeatmap from '#lib/components/CalendarHeatmap.svelte';
  import Skeleton from '#lib/elements/Skeleton.svelte';
  import { getAlbumStatisticsQuery } from '#lib/queries/album.query.ts';
  import { getAssetStatisticsQuery } from '#lib/queries/asset.query.ts';
  import { getMyCalendarHeatmapQuery } from '#lib/queries/user.query.ts';
  import { locale } from '#lib/stores/preferences.store.ts';
  import {
    AssetVisibility,
    CalendarHeatmapType,
    type AlbumStatisticsResponseDto,
    type AssetStatsResponseDto,
  } from '@immich/sdk';
  import { Heading, Table, TableBody, TableCell, TableHeader, TableHeading, TableRow } from '@immich/ui';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  const queries = {
    albums: createQuery(getAlbumStatisticsQuery),
    timeline: createQuery(() => getAssetStatisticsQuery({ visibility: AssetVisibility.Timeline })),
    favorites: createQuery(() => getAssetStatisticsQuery({ isFavorite: true })),
    archive: createQuery(() => getAssetStatisticsQuery({ visibility: AssetVisibility.Archive })),
    trash: createQuery(() => getAssetStatisticsQuery({ isTrashed: true })),
    uploads: createQuery(() => getMyCalendarHeatmapQuery(CalendarHeatmapType.Upload)),
    taken: createQuery(() => getMyCalendarHeatmapQuery(CalendarHeatmapType.Taken)),
  };

  const emptyStats: AssetStatsResponseDto = { videos: 0, images: 0, total: 0 };
  const albumStats: AlbumStatisticsResponseDto = $derived(queries.albums.data ?? { owned: 0, shared: 0, notShared: 0 });
</script>

{#snippet row(viewName: string, stats: AssetStatsResponseDto)}
  <TableRow>
    <TableCell class="w-1/4">{viewName}</TableCell>
    <TableCell class="w-1/4">{stats.images.toLocaleString($locale)}</TableCell>
    <TableCell class="w-1/4">{stats.videos.toLocaleString($locale)}</TableCell>
    <TableCell class="w-1/4">{stats.total.toLocaleString($locale)}</TableCell>
  </TableRow>
{/snippet}

<section class="my-4 w-full">
  <Heading size="tiny">{$t('photos_and_videos')}</Heading>
  <Table striped spacing="small" class="mt-4" size="small">
    <TableHeader>
      <TableHeading class="w-1/4">{$t('view_name')}</TableHeading>
      <TableHeading class="w-1/4">{$t('photos')}</TableHeading>
      <TableHeading class="w-1/4">{$t('videos')}</TableHeading>
      <TableHeading class="w-1/4">{$t('total')}</TableHeading>
    </TableHeader>
    <TableBody>
      {@render row($t('timeline'), queries.timeline.data ?? emptyStats)}
      {@render row($t('favorites'), queries.favorites.data ?? emptyStats)}
      {@render row($t('archive'), queries.archive.data ?? emptyStats)}
      {@render row($t('trash'), queries.trash.data ?? emptyStats)}
    </TableBody>
  </Table>

  <Heading size="tiny" class="mt-8">{$t('albums')}</Heading>
  <Table striped spacing="small" class="mt-4" size="small">
    <TableHeader>
      <TableHeading class="w-1/2">{$t('owned')}</TableHeading>
      <TableHeading class="w-1/2">{$t('shared')}</TableHeading>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell class="w-1/2">{albumStats.owned.toLocaleString($locale)}</TableCell>
        <TableCell class="w-1/2">{albumStats.shared.toLocaleString($locale)}</TableCell>
      </TableRow>
    </TableBody>
  </Table>

  <div class="hidden lg:block">
    <Heading size="tiny" class="mt-8">{$t('uploads')}</Heading>
    {#if queries.uploads.data}
      <CalendarHeatmap
        data={queries.uploads.data}
        itemLabel={(item) => $t('upload_day_count', { values: item })}
        totalLabel={(count) => $t('uploads_count', { values: { count } })}
      />
    {:else}
      <Skeleton height={80} class="mt-2 rounded-lg" />
    {/if}

    <Heading size="tiny" class="mt-8">{$t('assets')}</Heading>
    {#if queries.taken.data}
      <CalendarHeatmap
        data={queries.taken.data}
        itemLabel={(item) => $t('asset_day_count', { values: item })}
        totalLabel={(count) => $t('assets_count', { values: { count } })}
      />
    {:else}
      <Skeleton height={80} class="mt-2 rounded-lg" />
    {/if}
  </div>
</section>
