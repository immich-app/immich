<script lang="ts">
  import { goto } from '$app/navigation';
  import SharedLinkFormFields from '$lib/components/SharedLinkFormFields.svelte';
  import { Route } from '$lib/route';
  import { handleUpdateSharedLink } from '$lib/services/shared-link.service';
  import { SharedLinkType } from '@immich/sdk';
  import { FormModal } from '@immich/ui';
  import { mdiLink } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  const sharedLink = $derived(data.sharedLink);

  let description = $derived(sharedLink.description ?? '');
  let allowDownload = $derived(sharedLink.allowDownload);
  let allowUpload = $derived(sharedLink.allowUpload);
  let showMetadata = $derived(sharedLink.showMetadata);
  let password = $derived(sharedLink.password ?? '');
  let slug = $derived(sharedLink.slug ?? '');
  let shareType = $derived(sharedLink.album ? SharedLinkType.Album : SharedLinkType.Individual);
  let expiresAt = $derived(sharedLink.expiresAt);

  const onClose = async () => {
    await goto(Route.sharedLinks());
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
