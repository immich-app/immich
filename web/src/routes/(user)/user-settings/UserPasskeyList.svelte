<script lang="ts">
  import TableButton from '#lib/components/TableButton.svelte';
  import { dateFormats } from '#lib/constants.ts';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { searchPasskeysQuery } from '#lib/queries/passkey.query.ts';
  import { getPasskeyActions, getPasskeysActions } from '#lib/services/passkey.service.ts';
  import { locale } from '#lib/stores/preferences.store.ts';
  import { Button, Table, TableBody, TableCell, TableHeader, TableHeading, TableRow } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const query = createPreloadedQuery(searchPasskeysQuery);
  const passkeys = $derived(query.data);

  const { Create } = $derived(getPasskeysActions($t));
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

    {#if passkeys.length > 0}
      <Table class="mt-4" striped spacing="small" size="small">
        <TableHeader>
          <TableHeading>{$t('name')}</TableHeading>
          <TableHeading>{$t('created')}</TableHeading>
          <TableHeading>{$t('last_used')}</TableHeading>
          <TableHeading>{$t('action')}</TableHeading>
        </TableHeader>

        <TableBody>
          {#each passkeys as passkey (passkey.id)}
            {const { Update, Delete } = $derived(getPasskeyActions($t, passkey))}
            <TableRow>
              <TableCell>{passkey.name ?? $t('passkeys', { values: { count: 1 } })}</TableCell>
              <TableCell>{new Date(passkey.createdAt).toLocaleDateString($locale, dateFormats.settings)}</TableCell>
              <TableCell>
                {passkey.usedAt
                  ? new Date(passkey.usedAt).toLocaleDateString($locale, dateFormats.settings)
                  : $t('never')}
              </TableCell>
              <TableCell class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1">
                <TableButton action={Update} size="small" />
                <TableButton action={Delete} size="small" />
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {/if}
  </div>
</section>
