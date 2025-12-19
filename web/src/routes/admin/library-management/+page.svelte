<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AppRoute } from '$lib/constants';
  import { getLibrariesActions, handleShowLibraryCreateModal, handleViewLibrary } from '$lib/services/library.service';
  import { locale } from '$lib/stores/preferences.store';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import { getLibrary, getLibraryStatistics, type LibraryResponseDto } from '@immich/sdk';
  import { Button, CommandPaletteContext } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let libraries = $state(data.libraries);
  let statistics = $state(data.statistics);
  let owners = $state(data.owners);

  const onLibraryCreate = async (library: LibraryResponseDto) => {
    await goto(`${AppRoute.ADMIN_LIBRARY_MANAGEMENT}/${library.id}`);
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

  const { Create, ScanAll } = $derived(getLibrariesActions($t, libraries));
</script>

<OnEvents {onLibraryCreate} {onLibraryUpdate} {onLibraryDelete} />

<CommandPaletteContext commands={[Create, ScanAll]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[ScanAll, Create]}>
  <section class="my-4">
    <div class="flex flex-col items-center gap-2" in:fade={{ duration: 500 }}>
      {#if libraries.length > 0}
        <table class="text-start">
          <thead
            class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray"
          >
            <tr class="grid grid-cols-6 w-full place-items-center">
              <th class="text-center text-sm font-medium">{$t('name')}</th>
              <th class="text-center text-sm font-medium">{$t('owner')}</th>
              <th class="text-center text-sm font-medium">{$t('photos')}</th>
              <th class="text-center text-sm font-medium">{$t('videos')}</th>
              <th class="text-center text-sm font-medium">{$t('size')}</th>
              <th class="text-center text-sm font-medium"></th>
            </tr>
          </thead>
          <tbody class="block overflow-y-auto rounded-md border dark:border-immich-dark-gray">
            {#each libraries as library (library.id + library.name)}
              {@const { photos, usage, videos } = statistics[library.id]}
              {@const [diskUsage, diskUsageUnit] = getBytesWithUnit(usage, 0)}
              <tr
                class="grid grid-cols-6 h-20 w-full place-items-center text-center dark:text-immich-dark-fg even:bg-subtle/20 odd:bg-subtle/80"
              >
                <td class="text-ellipsis px-4 text-sm">{library.name}</td>
                <td class="text-ellipsis px-4 text-sm">
                  {owners[library.id].name}
                </td>
                <td class="text-ellipsis px-4 text-sm">
                  {photos.toLocaleString($locale)}
                </td>
                <td class="text-ellipsis px-4 text-sm">
                  {videos.toLocaleString($locale)}
                </td>
                <td class="text-ellipsis px-4 text-sm">
                  {diskUsage}
                  {diskUsageUnit}
                </td>

                <td class="flex gap-2 text-ellipsis px-4 text-sm">
                  <Button size="small" onclick={() => handleViewLibrary(library)}>{$t('view')}</Button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <EmptyPlaceholder
          text={$t('no_libraries_message')}
          onClick={handleShowLibraryCreateModal}
          class="mt-10 mx-auto"
        />
      {/if}
    </div>
  </section>
</AdminPageLayout>
