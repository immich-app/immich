<script lang="ts">
  import SharedLinkExpiration from '$lib/components/SharedLinkExpiration.svelte';
  import { handleUpdateSharedLink } from '$lib/services/shared-link.service';
  import { SharedLinkType, type SharedLinkResponseDto } from '@immich/sdk';
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, PasswordInput, Switch } from '@immich/ui';
  import { mdiLink } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: (success?: boolean) => void;
    sharedLink: SharedLinkResponseDto;
  }

  let { onClose, sharedLink }: Props = $props();

  let description = $state(sharedLink.description ?? '');
  let allowDownload = $state(sharedLink.allowDownload);
  let allowUpload = $state(sharedLink.allowUpload);
  let showMetadata = $state(sharedLink.showMetadata);
  let allowSubscribe = $state(sharedLink.allowSubscribe);
  let password = $state(sharedLink.password ?? '');
  let shareType = sharedLink.album ? SharedLinkType.Album : SharedLinkType.Individual;
  let expiresAt = $state(sharedLink.expiresAt);

  const onUpdate = async () => {
    const success = await handleUpdateSharedLink(sharedLink, {
      description,
      password: password ?? null,
      expiresAt,
      allowUpload,
      allowDownload,
      showMetadata,
      allowSubscribe,
    });

    if (success) {
      onClose(true);
    }
  };
</script>

<Modal title={$t('edit_link')} icon={mdiLink} size="small" {onClose}>
  <ModalBody>
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

      <Field label={$t('allow_user_to_subscribe')} description={$t('allow_user_to_subscribe_description')}>
        <Switch bind:checked={allowSubscribe} />
      </Field>
    </div>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button color="secondary" shape="round" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button fullWidth shape="round" onclick={onUpdate}>{$t('confirm')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
