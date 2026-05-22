<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { Route } from '$lib/route';
  import { getLibrariesActions, getLibraryActions } from '$lib/services/library.service';
  import { locale } from '$lib/stores/preferences.store';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import { getLibrary, getLibraryStatistics, type LibraryResponseDto } from '@immich/sdk';
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

  let libraries = $state(data.libraries);
  let statistics = $state(data.statistics);
  let owners = $state(data.owners);

  const onLibraryCreate = async (library: LibraryResponseDto) => {
    await goto(Route.viewLibrary(library));
  };

  const onLibraryUpdate = async (library: LibraryResponseDto) => {
    const index = libraries.findIndex(({ id }) => id === library.id);

    if (index === -1) {
      return;
    }

    libraries[index] = await getLibrary({ id: library.id });
    statistics[library.id] = await getLibraryStatistics({ id: library.id });
  };

  const onLibraryDelete = ({ id }: { id: string }) => {
    libraries = libraries.filter((library) => library.id !== id);
    delete statistics[id];
    delete owners[id];
  };

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
              {@const { photos, usage, videos } = statistics[library.id]}
              {@const [diskUsage, diskUsageUnit] = getBytesWithUnit(usage, 0)}
              {@const owner = owners[library.id]}
              <TableRow>
                <TableCell class={classes.column1}>
                  <Link href={Route.viewLibrary(library)}>{library.name}</Link>
                </TableCell>
                <TableCell class={classes.column2}>
                  <Link href={Route.viewUser(owner)}>{owner.name}</Link>
                </TableCell>
                <TableCell class={classes.column3}>{photos.toLocaleString($locale)}</TableCell>
                <TableCell class={classes.column4}>{videos.toLocaleString($locale)}</TableCell>
                <TableCell class={classes.column5}>{diskUsage} {diskUsageUnit}</TableCell>
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
