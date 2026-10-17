<script lang="ts">
  import { libraryTableClasses } from '$lib/constants';
  import { createPreloadedQuery } from '$lib/queries/client';
  import { getLibraryStatisticsQuery } from '$lib/queries/library.query';
  import { getUserAdminQuery } from '$lib/queries/user-admin.query';
  import { Route } from '$lib/route';
  import { getLibraryActions } from '$lib/services/library.service';
  import { locale } from '$lib/stores/preferences.store';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { ContextMenuButton, Link, MenuItemType, TableCell, TableRow } from '@immich/ui';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
  };

  const { library }: Props = $props();

  const ownerQuery = createPreloadedQuery(() => getUserAdminQuery(library.ownerId));
  const owner = $derived(ownerQuery.data);

  const query = createQuery(() => getLibraryStatisticsQuery(library.id));
  const stats = $derived(query.data);

  const actions = $derived.by(() => {
    const { Detail, Scan, Edit, Delete } = getLibraryActions($t, library);
    return [Detail, Scan, Edit, MenuItemType.Divider, Delete];
  });
</script>

<TableRow>
  <TableCell class={libraryTableClasses.column1}>
    <Link href={Route.viewLibrary(library)}>{library.name}</Link>
  </TableCell>
  <TableCell class={libraryTableClasses.column2}>
    <Link href={Route.viewUser(owner)}>{owner.name}</Link>
  </TableCell>
  {#if stats}
    {@const [diskUsage, diskUsageUnit] = getBytesWithUnit(stats.usage, 0)}
    <TableCell class={libraryTableClasses.column3}>
      {stats.photos.toLocaleString($locale)}
    </TableCell>
    <TableCell class={libraryTableClasses.column4}>
      {stats.videos.toLocaleString($locale)}
    </TableCell>
    <TableCell class={libraryTableClasses.column5}>
      {diskUsage}
      {diskUsageUnit}
    </TableCell>
  {:else}
    <TableCell class={libraryTableClasses.column3}>
      <span class="skeleton-loader inline-block h-4 w-14"></span>
    </TableCell>
    <TableCell class={libraryTableClasses.column4}>
      <span class="skeleton-loader inline-block h-4 w-14"></span>
    </TableCell>
    <TableCell class={libraryTableClasses.column5}>
      <span class="skeleton-loader inline-block h-4 w-20"></span>
    </TableCell>
  {/if}
  <TableCell class={libraryTableClasses.column6}>
    <ContextMenuButton color="primary" aria-label={$t('open')} items={actions} />
  </TableCell>
</TableRow>

<style>
  .skeleton-loader {
    position: relative;
    border-radius: 4px;
    overflow: hidden;
    background-color: rgba(156, 163, 175, 0.35);
  }

  .skeleton-loader::after {
    content: '';
    position: absolute;
    inset: 0;
    background-repeat: no-repeat;
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0.8) 50%,
      rgba(255, 255, 255, 0)
    );
    background-size: 200% 100%;
    background-position: 200% 0;
    animation: skeleton-animation 2000ms infinite;
  }

  @keyframes skeleton-animation {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
</style>
