<script lang="ts">
  import SharedLinkFormFields from '$lib/components/SharedLinkFormFields.svelte';
  import { handleCreateSharedLink } from '$lib/services/shared-link.service';
  import { SharedLinkType } from '@immich/sdk';
  import { FormModal } from '@immich/ui';
  import { mdiLink } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
    albumId?: string;
    assetIds?: string[];
  }

  let { onClose, albumId, assetIds }: Props = $props();

  let description = $state('');
  let allowDownload = $state(true);
  let allowUpload = $state(false);
  let showMetadata = $state(true);
  let password = $state('');
  let slug = $state('');
  let expiresAt = $state<string | null>(null);

  let type = $derived(albumId ? SharedLinkType.Album : SharedLinkType.Individual);

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
      onClose();
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

  <SharedLinkFormFields
    bind:slug
    bind:password
    bind:description
    bind:allowDownload
    bind:allowUpload
    bind:showMetadata
    bind:expiresAt
  />
</FormModal>
