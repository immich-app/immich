<script lang="ts">
  import { handleCreateStorageTarget, handleUpdateStorageTarget } from '$lib/services/storage-target.service';
  import { StorageTargetKind, type StorageTargetResponseDto, type StorageTargetSecretDto } from '@immich/sdk';
  import { Field, FormModal, Input, Select, Switch, Text } from '@immich/ui';
  import { mdiCloudOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    target?: StorageTargetResponseDto;
    onClose: () => void;
  };

  const { target, onClose }: Props = $props();

  const isEdit = !!target;

  let name = $state(target?.name ?? '');
  // The kind is fixed once a target exists: changing it would invalidate both the
  // stored credentials and every object already recorded against the target.
  let kind = $state<StorageTargetKind>(target?.kind ?? StorageTargetKind.S3);
  let isEnabled = $state(target?.isEnabled ?? true);
  let prefix = $state(target?.config.prefix ?? '');

  let endpoint = $state(target?.config.endpoint ?? '');
  let bucket = $state(target?.config.bucket ?? '');
  let region = $state(target?.config.region ?? 'us-east-1');
  let forcePathStyle = $state(target?.config.forcePathStyle ?? true);
  let baseUrl = $state(target?.config.baseUrl ?? '');
  let basePath = $state(target?.config.basePath ?? '');

  // Credentials are never sent to the browser, so these start blank even on an edit.
  let accessKeyId = $state('');
  let secretAccessKey = $state('');
  let username = $state('');
  let password = $state('');

  const kindOptions = $derived([
    { value: StorageTargetKind.S3, label: $t('admin.storage_target_kind_s3') },
    { value: StorageTargetKind.Webdav, label: $t('admin.storage_target_kind_webdav') },
    { value: StorageTargetKind.Local, label: $t('admin.storage_target_kind_local') },
  ]);

  const buildConfig = () => ({ endpoint, bucket, region, forcePathStyle, baseUrl, basePath, prefix });

  const buildSecret = (): StorageTargetSecretDto =>
    kind === StorageTargetKind.S3 ? { accessKeyId, secretAccessKey } : { username, password };

  // Blank credential fields on an edit mean "keep the stored ones" rather than
  // "clear them", so they are only sent when actually filled in.
  const hasNewCredentials = $derived(
    (kind === StorageTargetKind.S3 && !!accessKeyId && !!secretAccessKey) ||
      (kind === StorageTargetKind.Webdav && !!username && !!password),
  );

  const onSubmit = async () => {
    const config = buildConfig();

    const success = isEdit
      ? await handleUpdateStorageTarget(target.id, {
          name,
          config,
          isEnabled,
          secret: hasNewCredentials ? buildSecret() : undefined,
        })
      : await handleCreateStorageTarget({
          name,
          kind,
          config,
          secret: kind === StorageTargetKind.Local ? {} : buildSecret(),
          isEnabled,
        });

    if (success) {
      onClose();
    }
  };
</script>

<FormModal
  title={isEdit ? $t('admin.storage_target_edit') : $t('admin.storage_target_create')}
  icon={mdiCloudOutline}
  {onClose}
  {onSubmit}
  size="medium"
  submitText={isEdit ? $t('save') : $t('create')}
>
  <div class="flex flex-col gap-4">
    <Field label={$t('name')} required>
      <Input bind:value={name} placeholder="MinIO" />
    </Field>

    <Field label={$t('admin.storage_target_kind')}>
      <Select bind:value={kind} options={kindOptions} />
    </Field>

    {#if kind === StorageTargetKind.S3}
      <Field label={$t('admin.storage_target_bucket')} required>
        <Input bind:value={bucket} placeholder="immich" />
      </Field>
      <Field label={$t('admin.storage_target_endpoint')} description={$t('admin.storage_target_endpoint_description')}>
        <Input bind:value={endpoint} placeholder="http://minio:9000" />
      </Field>
      <Field label={$t('admin.storage_target_region')}>
        <Input bind:value={region} placeholder="us-east-1" />
      </Field>
      <Field
        label={$t('admin.storage_target_force_path_style')}
        description={$t('admin.storage_target_force_path_style_description')}
      >
        <Switch bind:checked={forcePathStyle} />
      </Field>
      <Field label={$t('admin.storage_target_access_key_id')} required={!isEdit}>
        <Input bind:value={accessKeyId} autocomplete="off" />
      </Field>
      <Field label={$t('admin.storage_target_secret_access_key')} required={!isEdit}>
        <Input type="password" bind:value={secretAccessKey} autocomplete="new-password" />
      </Field>
    {/if}

    {#if kind === StorageTargetKind.Webdav}
      <Field
        label={$t('admin.storage_target_base_url')}
        description={$t('admin.storage_target_base_url_description')}
        required
      >
        <Input bind:value={baseUrl} placeholder="https://nextcloud.example.com/remote.php/dav/files/alice" />
      </Field>
      <Field label={$t('admin.storage_target_username')} required={!isEdit}>
        <Input bind:value={username} autocomplete="off" />
      </Field>
      <Field label={$t('admin.storage_target_password')} required={!isEdit}>
        <Input type="password" bind:value={password} autocomplete="new-password" />
      </Field>
    {/if}

    {#if kind === StorageTargetKind.Local}
      <Field
        label={$t('admin.storage_target_base_path')}
        description={$t('admin.storage_target_base_path_description')}
        required
      >
        <Input bind:value={basePath} placeholder="/mnt/backup" />
      </Field>
    {/if}

    <Field label={$t('admin.storage_target_prefix')} description={$t('admin.storage_target_prefix_description')}>
      <Input bind:value={prefix} placeholder="immich" />
    </Field>

    <Field label={$t('enabled')}>
      <Switch bind:checked={isEnabled} />
    </Field>

    {#if isEdit && kind !== StorageTargetKind.Local}
      <Text size="small" color="secondary">{$t('admin.storage_target_credentials_unchanged')}</Text>
    {/if}
  </div>
</FormModal>
