<script lang="ts">
  import OnEvents from '$lib/components/OnEvents.svelte';
  import TableButton from '$lib/components/TableButton.svelte';
  import { dateFormats } from '$lib/constants';
  import { getPasskeyActions, getPasskeysActions } from '$lib/services/passkey.service';
  import { locale } from '$lib/stores/preferences.store';
  import { type PasskeyResponseDto } from '@immich/sdk';
  import { Button, Table, TableBody, TableCell, TableHeader, TableHeading, TableRow } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  type Props = {
    passkeys: PasskeyResponseDto[];
  };

  let { passkeys = $bindable() }: Props = $props();

  const onPasskeyCreate = (passkey: PasskeyResponseDto) => {
    passkeys = [passkey, ...passkeys];
  };

  const onPasskeyUpdate = (update: PasskeyResponseDto) => {
    passkeys = passkeys.map((passkey) => (passkey.id === update.id ? update : passkey));
  };

  const onPasskeyDelete = ({ id }: PasskeyResponseDto) => {
    passkeys = passkeys.filter((passkey) => passkey.id !== id);
  };

  const { Create } = $derived(getPasskeysActions($t));
</script>

<OnEvents {onPasskeyCreate} {onPasskeyUpdate} {onPasskeyDelete} />

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
            {@const { Update, Delete } = getPasskeyActions($t, passkey)}
            <TableRow>
              <TableCell>{passkey.name ?? $t('passkey')}</TableCell>
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
