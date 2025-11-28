<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import { IconButton } from '@immich/ui';
  import { mdiDotsVertical } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  // async function switchToMaintenance() {
  //   try {
  //     await setMaintenanceMode({
  //       setMaintenanceModeDto: {
  //         action: MaintenanceAction.Start,
  //       },
  //     });
  //   } catch (error) {
  //     handleError(error, $t('admin.maintenance_start_error'));
  //   }
  // }
</script>

<AdminPageLayout
  breadcrumbs={[
    { title: $t('admin.maintenance_settings'), href: AppRoute.ADMIN_MAINTENANCE_SETTINGS },
    { title: $t('admin.maintenance_integrity_report') },
    { title: data.meta.title },
  ]}
>
  <!-- {#snippet buttons()}
    <HStack gap={1}>
      <Button
        leadingIcon={mdiProgressWrench}
        size="small"
        variant="ghost"
        color="secondary"
        onclick={switchToMaintenance}
      >
        <Text class="hidden md:block">{$t('admin.maintenance_start')}</Text>
      </Button>
    </HStack>
  {/snippet} -->

  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      <table class="mt-5 w-full text-start">
        <thead
          class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray"
        >
          <tr class="flex w-full place-items-center">
            <th class="w-7/8 text-left px-2 text-sm font-medium">{$t('filename')}</th>
            <th class="w-1/8"></th>
          </tr>
        </thead>
        <tbody
          class="block max-h-80 w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
        >
          {#each data.integrityReport.items as { id, path } (id)}
            <tr class="flex py-1 w-full place-items-center even:bg-subtle/20 odd:bg-subtle/80">
              <td class="w-7/8 text-ellipsis text-left px-2 text-sm select-all">{path}</td>
              <td class="w-1/8 text-ellipsis text-right flex justify-end px-2">
                <IconButton aria-label="Open" color="secondary" icon={mdiDotsVertical} variant="ghost" /></td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  </section>
</AdminPageLayout>
