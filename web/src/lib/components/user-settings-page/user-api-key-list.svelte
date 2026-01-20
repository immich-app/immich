<script lang="ts">
  import OnEvents from '$lib/components/OnEvents.svelte';
  import TableButton from '$lib/components/TableButton.svelte';
  import { dateFormats } from '$lib/constants';
  import { getApiKeyActions, getApiKeysActions } from '$lib/services/api-key.service';
  import { locale } from '$lib/stores/preferences.store';
  import { getApiKeys, type ApiKeyResponseDto } from '@immich/sdk';
  import { Button, Table, TableBody, TableCell, TableHeader, TableHeading, TableRow, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  type Props = {
    keys: ApiKeyResponseDto[];
  };

  let { keys = $bindable() }: Props = $props();

  const onApiKeyCreate = async () => {
    keys = await getApiKeys();
  };

  const onApiKeyUpdate = (update: ApiKeyResponseDto) => {
    keys = keys.map((key) => (key.id === update.id ? update : key));
  };

  const onApiKeyDelete = ({ id }: ApiKeyResponseDto) => {
    keys = keys.filter((key) => key.id !== id);
  };

  const { Create } = $derived(getApiKeysActions($t));
</script>

<OnEvents {onApiKeyCreate} {onApiKeyUpdate} {onApiKeyDelete} />

<section class="my-4">
  <div class="flex flex-col gap-2" in:fade={{ duration: 500 }}>
    <div class="mb-2 flex justify-end">
      <Button leadingIcon={Create.icon} shape="round" size="small" onclick={() => Create.onAction(Create)}>
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
            {@const { Update, Delete } = getApiKeyActions($t, key)}
            <TableRow>
              <TableCell>{key.name}</TableCell>
              <TableCell>
                <Text
                  class="font-mono overflow-hidden line-clamp-3"
                  size="small"
                  title={JSON.stringify(key.permissions, null, 2)}>{key.permissions}</Text
                >
              </TableCell>
              <TableCell>{new Date(key.createdAt).toLocaleDateString($locale, dateFormats.settings)}</TableCell>
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
