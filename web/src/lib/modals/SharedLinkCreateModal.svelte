<script lang="ts">
  import SharedLinkExpiration from '$lib/components/SharedLinkExpiration.svelte';
  import { handleCreateSharedLink } from '$lib/services/shared-link.service';
  import { SharedLinkType } from '@immich/sdk';
  import { Field, FormModal, Input, PasswordInput, Switch, Text } from '@immich/ui';
  import { mdiLink } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: (success?: boolean) => void;
    albumId?: string;
    assetIds?: string[];
  }

  let { onClose, albumId = $bindable(), assetIds = $bindable([]) }: Props = $props();

  let description = $state('');
  let allowDownload = $state(true);
  let allowUpload = $state(false);
  let showMetadata = $state(true);
  let password = $state('');
  let slug = $state('');
  let expiresAt = $state<string | null>(null);

  let type = $derived(albumId ? SharedLinkType.Album : SharedLinkType.Individual);

  $effect(() => {
    if (!showMetadata) {
      allowDownload = false;
    }
  });

  const onSubmit = async () => {
    const success = await handleCreateSharedLink({
      type,
      albumId,
      assetIds,
      expiresAt,
      allowUpload,
      description,
      password,
      allowDownload,
      showMetadata,
      slug,
    });
    if (success) {
      onClose(true);
    }
  };
</script>

<FormModal
  title={$t('create_link_to_share')}
  icon={mdiLink}
  size="small"
  {onClose}
  {onSubmit}
  submitText={$t('create_link')}
>
  {#if type === SharedLinkType.Album}
    <div>{$t('album_with_link_access')}</div>
  {/if}

  {#if type === SharedLinkType.Individual}
    <div>{$t('create_link_to_share_description')}</div>
  {/if}

  <div class="flex flex-col gap-4 mt-4">
    <div>
      <Field label={$t('custom_url')} description={$t('shared_link_custom_url_description')}>
        <Input bind:value={slug} autocomplete="off" />
      </Field>
      {#if slug}
        <Text size="tiny" color="muted" class="pt-2 break-all">/s/{encodeURIComponent(slug)}</Text>
      {/if}
    </div>

    <Field label={$t('password')} description={$t('shared_link_password_description')}>
      <PasswordInput bind:value={password} autocomplete="new-password" />
    </Field>

    <Field label={$t('description')}>
      <Input bind:value={description} autocomplete="off" />
    </Field>

    <SharedLinkExpiration bind:expiresAt />

    <Field label={$t('show_metadata')}>
      <Switch bind:checked={showMetadata} />
    </Field>

    <Field label={$t('allow_public_user_to_download')} disabled={!showMetadata}>
      <Switch bind:checked={allowDownload} />
    </Field>

    <Field label={$t('allow_public_user_to_upload')}>
      <Switch bind:checked={allowUpload} />
    </Field>
  </div>
</FormModal>
