<script lang="ts">
  import { goto } from '$app/navigation';
  import SharedLinkExpiration from '$lib/components/SharedLinkExpiration.svelte';
  import { AppRoute } from '$lib/constants';
  import { handleUpdateSharedLink } from '$lib/services/shared-link.service';
  import { SharedLinkType } from '@immich/sdk';
  import { Field, FormModal, Input, PasswordInput, Switch, Text } from '@immich/ui';
  import { mdiLink } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  const sharedLink = $state(data.sharedLink);

  let description = $state(sharedLink.description ?? '');
  let allowDownload = $state(sharedLink.allowDownload);
  let allowUpload = $state(sharedLink.allowUpload);
  let showMetadata = $state(sharedLink.showMetadata);
  let password = $state(sharedLink.password ?? '');
  let slug = $state(sharedLink.slug ?? '');
  let shareType = sharedLink.album ? SharedLinkType.Album : SharedLinkType.Individual;
  let expiresAt = $state(sharedLink.expiresAt);

  const onClose = async () => {
    await goto(`${AppRoute.SHARED_LINKS}`);
  };

  const onSubmit = async () => {
    const success = await handleUpdateSharedLink(sharedLink, {
      description,
      password: password ?? null,
      expiresAt,
      allowUpload,
      allowDownload,
      showMetadata,
      slug: slug.trim() ?? null,
    });
    if (success) {
      await onClose();
    }
  };
</script>

<FormModal title={$t('edit_link')} icon={mdiLink} {onClose} {onSubmit} submitText={$t('confirm')} size="small">
  {#if shareType === SharedLinkType.Album}
    <div class="text-sm">
      {$t('public_album')} |
      <span class="text-primary">{sharedLink.album?.albumName}</span>
    </div>
  {/if}

  {#if shareType === SharedLinkType.Individual}
    <div class="text-sm">
      {$t('individual_share')} |
      <span class="text-primary">{sharedLink.description || ''}</span>
    </div>
  {/if}

  <div class="flex flex-col gap-4 mt-4">
    <div>
      <Field label={$t('custom_url')} description={$t('shared_link_custom_url_description')}>
        <Input bind:value={slug} autocomplete="off" />
      </Field>
      {#if slug}
        <Text size="tiny" color="muted" class="pt-2">/s/{encodeURIComponent(slug)}</Text>
      {/if}
    </div>

    <Field label={$t('password')} description={$t('shared_link_password_description')}>
      <PasswordInput bind:value={password} autocomplete="new-password" />
    </Field>

    <Field label={$t('description')}>
      <Input bind:value={description} autocomplete="off" />
    </Field>

    <SharedLinkExpiration createdAt={sharedLink.createdAt} bind:expiresAt />

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
