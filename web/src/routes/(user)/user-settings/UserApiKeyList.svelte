<script lang="ts">
  import TableButton from '$lib/components/TableButton.svelte';
  import { dateFormats } from '$lib/constants';
  import { getApiKeysQuery } from '$lib/queries/api-key.query';
  import { createPreloadedQuery } from '$lib/queries/client';
  import { getApiKeyActions, getApiKeysActions } from '$lib/services/api-key.service';
  import { locale } from '$lib/stores/preferences.store';
  import { Button, Table, TableBody, TableCell, TableHeader, TableHeading, TableRow, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const query = createPreloadedQuery(getApiKeysQuery);
  const keys = $derived(query.data);

  const { Create } = $derived(getApiKeysActions($t));
</script>

<section class="my-4">
  <div class="flex flex-col gap-2 sm:ms-8" in:fade={{ duration: 500 }}>
    <div class="mb-2 flex justify-end">
      <Button
        leadingIcon={Create.icon}
        shape="round"
        size="small"
        onclick={(event: MouseEvent) => Create.onAction({ event, action: Create })}
      >
        {Create.title}
      </Button>
    </div>

    {#if keys.length > 0}
      <Table class="mt-4" striped spacing="small" size="small">
        <TableHeader>
          <TableHeading>{$t('name')}</TableHeading>
          <TableHeading>{$t('permission')}</TableHeading>
          <TableHeading>{$t('created')}</TableHeading>
          <TableHeading>{$t('action')}</TableHeading>
        </TableHeader>

        <TableBody>
          {#each keys as key (key.id)}
            {@const { Update, Rotate, Delete } = getApiKeyActions($t, key)}
            <TableRow>
              <TableCell>{key.name}</TableCell>
              <TableCell>
                <Text
                  class="line-clamp-3 overflow-hidden font-mono"
                  size="small"
                  title={JSON.stringify(key.permissions, null, 2)}>{key.permissions}</Text
                >
              </TableCell>
              <TableCell>{new Date(key.createdAt).toLocaleDateString($locale, dateFormats.settings)}</TableCell>
              <TableCell class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1">
                <TableButton action={Update} size="small" />
                <TableButton action={Rotate} size="small" />
                <TableButton action={Delete} size="small" />
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {/if}
  </div>
</section>
