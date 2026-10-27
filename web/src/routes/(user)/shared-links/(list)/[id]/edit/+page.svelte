<script lang="ts">
  import { goto } from '$app/navigation';
  import SharedLinkFormFields from '#lib/components/SharedLinkFormFields.svelte';
  import { Route } from '#lib/route.ts';
  import { createPreloadedQuery, executeMutation } from '#lib/queries/client.ts';
  import { getSharedLinkQuery, updateSharedLinkMutation } from '#lib/queries/shared-link.query.ts';
  import { SharedLinkType } from '@immich/sdk';
  import { FormModal } from '@immich/ui';
  import { mdiLink } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();

  const query = createPreloadedQuery(() => getSharedLinkQuery(params.id));
  const sharedLink = $derived(query.data);

  let description = $state(sharedLink.description ?? '');
  let allowDownload = $state(sharedLink.allowDownload);
  let allowUpload = $state(sharedLink.allowUpload);
  let showMetadata = $state(sharedLink.showMetadata);
  let password = $state(sharedLink.password ?? '');
  let slug = $state(sharedLink.slug ?? '');
  let shareType = sharedLink.album ? SharedLinkType.Album : SharedLinkType.Individual;
  let expiresAt = $state(sharedLink.expiresAt);

  const onClose = () => void goto(Route.sharedLinks());
  const onSubmit = async () => {
    const sharedLinkEditDto = {
      description,
      password: password ?? null,
      expiresAt,
      allowUpload,
      allowDownload,
      showMetadata,
      slug: slug.trim() ?? null,
    };
    await executeMutation(updateSharedLinkMutation, [{ id: sharedLink.id, sharedLinkEditDto }], { onSuccess: onClose });
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
      {$t('individual_share')}
      {#if description !== ''}
        | <span class="text-primary">{description}</span>
      {/if}
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
