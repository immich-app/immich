<script lang="ts">
  import { handleCreateSyncNode, handleUpdateSyncNode } from '$lib/services/sync-node.service';
  import type { SyncNodeResponseDto } from '@immich/sdk';
  import { Field, FormModal, Input, Switch, Text } from '@immich/ui';
  import { mdiServerNetwork } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    node?: SyncNodeResponseDto;
    onClose: () => void;
  };

  const { node, onClose }: Props = $props();

  const isEdit = !!node;

  let name = $state(node?.name ?? '');
  let url = $state(node?.url ?? '');
  let isEnabled = $state(node?.isEnabled ?? true);
  // The key is never sent to the browser, so this starts blank even on an edit.
  let apiKey = $state('');

  const onSubmit = async () => {
    const success = isEdit
      ? await handleUpdateSyncNode(node.id, { name, url, isEnabled, apiKey: apiKey || undefined })
      : await handleCreateSyncNode({ name, url, apiKey, isEnabled });

    if (success) {
      onClose();
    }
  };
</script>

<FormModal
  title={isEdit ? $t('admin.sync_node_edit') : $t('admin.sync_node_add')}
  icon={mdiServerNetwork}
  {onClose}
  {onSubmit}
  size="medium"
  submitText={isEdit ? $t('save') : $t('add')}
>
  <div class="flex flex-col gap-4">
    <Text size="small" color="secondary">{$t('admin.sync_node_add_description')}</Text>

    <Field label={$t('name')} required>
      <Input bind:value={name} placeholder="Backup server" />
    </Field>

    <Field label={$t('url')} description={$t('admin.sync_node_url_description')} required>
      <Input bind:value={url} placeholder="https://immich.example.com" />
    </Field>

    <Field label={$t('api_key')} description={$t('admin.sync_node_api_key_description')} required={!isEdit}>
      <Input type="password" bind:value={apiKey} autocomplete="new-password" />
    </Field>

    <Field label={$t('enabled')} description={$t('admin.sync_node_enabled_description')}>
      <Switch bind:checked={isEnabled} />
    </Field>

    {#if isEdit}
      <Text size="small" color="secondary">{$t('admin.sync_node_api_key_unchanged')}</Text>
    {/if}
  </div>
</FormModal>
