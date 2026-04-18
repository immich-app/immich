<script lang="ts">
  import { goto, invalidate } from '$app/navigation';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { Route } from '$lib/route';
  import { getLibrariesActions, getLibraryActions } from '$lib/services/library.service';
  import { locale } from '$lib/stores/preferences.store';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import { type LibraryResponseDto } from '@immich/sdk';
  import {
    CommandPaletteDefaultProvider,
    Container,
    ContextMenuButton,
    Link,
    MenuItemType,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeading,
    TableRow,
  } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { LayoutData } from './$types';

  type Props = {
    children?: Snippet;
    data: LayoutData;
  };

  let { children, data }: Props = $props();

  let libraries = $derived([...data.libraries]);
  let owners = $derived({ ...data.owners });

  const onLibraryCreate = async (library: LibraryResponseDto) => {
    await goto(Route.viewLibrary(library));
  };

  const onLibraryUpdate = () => invalidate('app:libraries');
  const onLibraryDelete = () => invalidate('app:libraries');

  const { Create, ScanAll } = $derived(getLibrariesActions($t));

  const getActionsForLibrary = (library: LibraryResponseDto) => {
    const { Detail, Scan, Edit, Delete } = getLibraryActions($t, library);
    return [Detail, Scan, Edit, MenuItemType.Divider, Delete];
  };

  const classes = {
    column1: 'w-4/12',
    column2: 'w-4/12',
    column3: 'w-1/12',
    column4: 'w-1/12',
    column5: 'w-1/12',
    column6: 'w-1/12 flex justify-end',
  };
</script>

<OnEvents {onLibraryCreate} {onLibraryUpdate} {onLibraryDelete} />

<CommandPaletteDefaultProvider name={$t('library')} actions={[Create, ScanAll]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[ScanAll, Create]}>
  <Container size="large" center class="my-4">
    <div class="flex flex-col items-center gap-2" in:fade={{ duration: 500 }}>
      {#if libraries.length > 0}
        <Table striped size="small" spacing="small">
          <TableHeader>
            <TableHeading class={classes.column1}>{$t('name')}</TableHeading>
            <TableHeading class={classes.column2}>{$t('owner')}</TableHeading>
            <TableHeading class={classes.column3}>{$t('photos')}</TableHeading>
            <TableHeading class={classes.column4}>{$t('videos')}</TableHeading>
            <TableHeading class={classes.column5}>{$t('size')}</TableHeading>
            <TableHeading class={classes.column6}></TableHeading>
          </TableHeader>
          <TableBody>
            {#each libraries as library (library.id + library.name)}
              {@const owner = owners[library.id]}
              <TableRow>
                <TableCell class={classes.column1}>
                  <Link href={Route.viewLibrary(library)}>{library.name}</Link>
                </TableCell>
                <TableCell class={classes.column2}>
                  <Link href={Route.viewUser(owner)}>{owner.name}</Link>
                </TableCell>
                {#await data.statisticsPromise}
                  <TableCell class={classes.column3}>
                    <span class="skeleton-loader inline-block h-4 w-14"></span>
                  </TableCell>
                  <TableCell class={classes.column4}>
                    <span class="skeleton-loader inline-block h-4 w-14"></span>
                  </TableCell>
                  <TableCell class={classes.column5}>
                    <span class="skeleton-loader inline-block h-4 w-20"></span>
                  </TableCell>
                {:then loadedStats}
                  {@const stats = loadedStats[library.id]}
                  <TableCell class={classes.column3}>
                    {stats.photos.toLocaleString($locale)}
                  </TableCell>
                  <TableCell class={classes.column4}>
                    {stats.videos.toLocaleString($locale)}
                  </TableCell>
                  <TableCell class={classes.column5}>
                    {@const [diskUsage, diskUsageUnit] = getBytesWithUnit(stats.usage, 0)}
                    {diskUsage}
                    {diskUsageUnit}
                  </TableCell>
                {:catch}
                  <TableCell class={classes.column3}>
                    <span class="skeleton-loader inline-block h-4 w-14"></span>
                  </TableCell>
                  <TableCell class={classes.column4}>
                    <span class="skeleton-loader inline-block h-4 w-14"></span>
                  </TableCell>
                  <TableCell class={classes.column5}>
                    <span class="skeleton-loader inline-block h-4 w-20"></span>
                  </TableCell>
                {/await}
                <TableCell class={classes.column6}>
                  <ContextMenuButton color="primary" aria-label={$t('open')} items={getActionsForLibrary(library)} />
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {:else}
        <EmptyPlaceholder
          fullWidth
          text={$t('no_libraries_message')}
          onClick={() => goto(Route.newLibrary())}
          class="mt-10 mx-auto"
        />
      {/if}

      {@render children?.()}
    </div>
  </Container>
</AdminPageLayout>

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
