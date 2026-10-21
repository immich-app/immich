<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import { libraryTableClasses } from '$lib/constants';
  import { Route } from '$lib/route';
  import { createPreloadedQuery } from '$lib/queries/client';
  import { getAllLibrariesQuery } from '$lib/queries/library.query';
  import { getLibrariesActions } from '$lib/services/library.service';
  import { CommandPaletteDefaultProvider, Container, Table, TableBody, TableHeader, TableHeading } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { LayoutData } from './$types';
  import LibraryTableRow from './LibraryTableRow.svelte';

  type Props = {
    children?: Snippet;
    data: LayoutData;
  };

  let { children, data }: Props = $props();

  const query = createPreloadedQuery(getAllLibrariesQuery);
  const libraries = $derived(query.data);

  const { Create, ScanAll } = $derived(getLibrariesActions($t));
</script>

<CommandPaletteDefaultProvider name={$t('library')} actions={[Create, ScanAll]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[ScanAll, Create]}>
  <Container size="large" center class="my-4">
    <div class="flex flex-col items-center gap-2" in:fade={{ duration: 500 }}>
      {#if libraries.length > 0}
        <Table striped size="small" spacing="small">
          <TableHeader>
            <TableHeading class={libraryTableClasses.column1}>{$t('name')}</TableHeading>
            <TableHeading class={libraryTableClasses.column2}>{$t('owner')}</TableHeading>
            <TableHeading class={libraryTableClasses.column3}>{$t('photos')}</TableHeading>
            <TableHeading class={libraryTableClasses.column4}>{$t('videos')}</TableHeading>
            <TableHeading class={libraryTableClasses.column5}>{$t('size')}</TableHeading>
            <TableHeading class={libraryTableClasses.column6}></TableHeading>
          </TableHeader>
          <TableBody>
            {#each libraries as library (library.id)}
              <LibraryTableRow {library} />
            {/each}
          </TableBody>
        </Table>
      {:else}
        <EmptyPlaceholder
          fullWidth
          text={$t('no_libraries_message')}
          onClick={() => goto(Route.newLibrary())}
          class="mx-auto mt-10"
        />
      {/if}

      {@render children?.()}
    </div>
  </Container>
</AdminPageLayout>
