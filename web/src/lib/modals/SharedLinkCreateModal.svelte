<script lang="ts">
  import SharedLinkExpiration from '$lib/components/SharedLinkExpiration.svelte';
  import { handleCreateSharedLink } from '$lib/services/shared-link.service';
  import { SharedLinkType } from '@immich/sdk';
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, PasswordInput, Switch } from '@immich/ui';
  import { mdiLink } from '@mdi/js';
  import { DateTime } from 'luxon';
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
  let allowSubscribe = $state(false);
  let expirationOption: number = $state(0);
  let password = $state('');
  let expiresAt = $state<string | null>(null);

  let shareType = $derived(albumId ? SharedLinkType.Album : SharedLinkType.Individual);

  $effect(() => {
    if (!showMetadata) {
      allowDownload = false;
    }
  });

  const onCreate = async () => {
    const success = await handleCreateSharedLink({
      type: shareType,
      albumId,
      assetIds,
      expiresAt: expirationOption > 0 ? DateTime.now().plus(expirationOption).toISO() : undefined,
      allowUpload,
      description,
      password,
      allowDownload,
      showMetadata,
      allowSubscribe,
    });

    if (success) {
      onClose(true);
    }
  };
</script>

<Modal title={$t('create_link_to_share')} icon={mdiLink} size="small" {onClose}>
  <ModalBody>
    {#if shareType === SharedLinkType.Album}
      <div>{$t('album_with_link_access')}</div>
    {/if}

    {#if shareType === SharedLinkType.Individual}
      <div>{$t('create_link_to_share_description')}</div>
    {/if}

    <div class="flex flex-col gap-4 mt-4">
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

      <Field label={$t('allow_user_to_subscribe')} description={$t('allow_user_to_subscribe_description')}>
        <Switch bind:checked={allowSubscribe} />
      </Field>
    </div>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button color="secondary" shape="round" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button fullWidth shape="round" onclick={onCreate}>{$t('create_link')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
