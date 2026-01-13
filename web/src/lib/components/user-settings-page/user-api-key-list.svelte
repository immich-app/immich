<script lang="ts">
  import OnEvents from '$lib/components/OnEvents.svelte';
  import TableButton from '$lib/components/TableButton.svelte';
  import { dateFormats } from '$lib/constants';
  import { getApiKeyActions, getApiKeysActions } from '$lib/services/api-key.service';
  import { locale } from '$lib/stores/preferences.store';
  import { getApiKeys, type ApiKeyResponseDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
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
    for (const key of keys) {
      if (key.id === update.id) {
        Object.assign(key, update);
      }
    }
  };

  const onApiKeyDelete = ({ id }: ApiKeyResponseDto) => {
    keys = keys.filter((apiKey) => apiKey.id !== id);
  };

  const { Create } = $derived(getApiKeysActions($t));
</script>

<OnEvents {onApiKeyCreate} {onApiKeyUpdate} {onApiKeyDelete} />

<section class="my-4">
  <div class="flex flex-col gap-2" in:fade={{ duration: 500 }}>
    <div class="mb-2 flex justify-end">
      <Button leadingIcon={Create.icon} shape="round" size="small" onclick={() => Create.onAction(Create)}
        >{Create.title}</Button
      >
    </div>

    {#if keys.length > 0}
      <table class="w-full text-start">
        <thead
          class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray"
        >
          <tr class="flex w-full place-items-center">
            <th class="w-1/4 text-center text-sm font-medium">{$t('name')}</th>
            <th class="w-1/4 text-center text-sm font-medium">{$t('permission')}</th>
            <th class="w-1/4 text-center text-sm font-medium">{$t('created')}</th>
            <th class="w-1/4 text-center text-sm font-medium">{$t('action')}</th>
          </tr>
        </thead>
        <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
          {#each keys as key (key.id)}
            {@const { Update, Delete } = getApiKeyActions($t, key)}
            <tr
              class="flex h-20 w-full place-items-center text-center dark:text-immich-dark-fg even:bg-subtle/20 odd:bg-subtle/80"
            >
              <td class="w-1/4 text-ellipsis px-4 text-sm overflow-hidden">{key.name}</td>
              <td
                class="w-1/4 text-ellipsis px-4 text-xs overflow-hidden line-clamp-3 break-all font-mono"
                title={JSON.stringify(key.permissions, undefined, 2)}>{key.permissions}</td
              >
              <td class="w-1/4 text-ellipsis px-4 text-sm overflow-hidden"
                >{new Date(key.createdAt).toLocaleDateString($locale, dateFormats.settings)}
              </td>
              <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/4">
                <TableButton action={Update} size="small" />
                <TableButton action={Delete} size="small" />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</section>
