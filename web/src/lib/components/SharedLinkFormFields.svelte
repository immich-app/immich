<script lang="ts">
  import SharedLinkExpiration from '#lib/components/SharedLinkExpiration.svelte';
  import { getAlbumQuery } from '#lib/queries/album.query.ts';
  import { queryClient } from '#lib/queries/client.ts';
  import { getPrivateAssetPresenceQuery } from '#lib/queries/search.query.ts';
  import { getAllTagsQuery } from '#lib/queries/tag.query.ts';
  import { publicTags } from '#lib/utils/tree-utils.ts';
  import { Field, HelperText, Input, PasswordInput, Switch, Text } from '@immich/ui';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  type Props = {
    slug: string;
    password: string;
    description: string;
    allowDownload: boolean;
    allowUpload: boolean;
    showMetadata: boolean;
    expiresAt: string | null;
    includePrivateAssets?: boolean;
    hasPrivateAssets?: boolean;
    albumId?: string;
    assetIds?: string[];
  };

  let {
    slug = $bindable(),
    password = $bindable(),
    description = $bindable(),
    allowDownload = $bindable(),
    allowUpload = $bindable(),
    showMetadata = $bindable(),
    expiresAt = $bindable(),
    includePrivateAssets = $bindable(false),
    hasPrivateAssets = false,
    albumId,
    assetIds = [],
  }: Props = $props();

  const album = createQuery(
    () => ({ ...getAlbumQuery(albumId ?? ''), enabled: !!albumId }),
    () => queryClient,
  );
  const tags = createQuery(
    () => ({ ...getAllTagsQuery(), enabled: !albumId && assetIds.length > 0 }),
    () => queryClient,
  );
  const privateTagIds = $derived.by(() => {
    const hierarchy = tags.data ?? [];
    const visible = new Set(publicTags(hierarchy).map(({ id }) => id));
    return hierarchy.filter(({ id }) => !visible.has(id)).map(({ id }) => id);
  });
  const privateAssets = createQuery(
    () => getPrivateAssetPresenceQuery(albumId ? [] : assetIds, privateTagIds),
    () => queryClient,
  );
  const showPrivateAssets = $derived(
    albumId ? album.data?.hasPrivateAssets === true : hasPrivateAssets || privateAssets.data === true,
  );

  $effect(() => {
    if (!showMetadata && allowDownload) {
      allowDownload = false;
    }
  });
</script>

<div class="mt-4 flex flex-col gap-4">
  <div>
    <Field label={$t('shared_link_custom_url_title')} description={$t('shared_link_custom_url_description')}>
      <Input bind:value={slug} autocomplete="off" />
      {#if slug.includes('/')}
        <HelperText class="text-warning">{$t('shared_link_custom_url_warning')}</HelperText>
      {/if}
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
  {#if showPrivateAssets}
    <Field label={$t('include_private_photos')} description={$t('include_private_photos_description')}>
      <Switch bind:checked={includePrivateAssets} />
    </Field>
  {/if}
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
