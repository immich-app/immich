<script lang="ts">
  import SharedLinkExpiration from '$lib/components/SharedLinkExpiration.svelte';
  import { Field, Input, PasswordInput, Switch, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    slug: string;
    password: string;
    description: string;
    allowDownload: boolean;
    allowUpload: boolean;
    showMetadata: boolean;
    expiresAt: string | null;
  };

  let {
    slug = $bindable(),
    password = $bindable(),
    description = $bindable(),
    allowDownload = $bindable(),
    allowUpload = $bindable(),
    showMetadata = $bindable(),
    expiresAt = $bindable(),
  }: Props = $props();

  $effect(() => {
    if (!showMetadata && allowDownload) {
      allowDownload = false;
    }
  });
</script>

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
