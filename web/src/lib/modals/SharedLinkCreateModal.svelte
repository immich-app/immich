<script lang="ts">
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { handleError } from '$lib/utils/handle-error';
  import { SharedLinkType, createSharedLink, updateSharedLink, type SharedLinkResponseDto } from '@immich/sdk';
  import { Button, Field, Input, Modal, ModalBody, ModalFooter, PasswordInput, Switch, Text } from '@immich/ui';
  import { mdiLink } from '@mdi/js';
  import { DateTime, Duration } from 'luxon';
  import { t } from 'svelte-i18n';
  import { NotificationType, notificationController } from '../components/shared-components/notification/notification';

  interface Props {
    onClose: (sharedLink?: SharedLinkResponseDto) => void;
    albumId?: string | undefined;
    assetIds?: string[];
    editingLink?: SharedLinkResponseDto | undefined;
  }

  let { onClose, albumId = $bindable(undefined), assetIds = $bindable([]), editingLink = undefined }: Props = $props();

  let sharedLink: string | null = $state(null);
  let description = $state('');
  let allowDownload = $state(true);
  let allowUpload = $state(false);
  let showMetadata = $state(true);
  let expirationOption: number = $state(0);
  let password = $state('');
  let slug = $state('');
  let shouldChangeExpirationTime = $state(false);

  const expirationOptions: [number, Intl.RelativeTimeFormatUnit][] = [
    [30, 'minutes'],
    [1, 'hour'],
    [6, 'hours'],
    [1, 'day'],
    [7, 'days'],
    [30, 'days'],
    [3, 'months'],
    [1, 'year'],
  ];

  let relativeTime = $derived(new Intl.RelativeTimeFormat($locale));
  let expiredDateOptions = $derived([
    { text: $t('never'), value: 0 },
    ...expirationOptions.map(([value, unit]) => ({
      text: relativeTime.format(value, unit),
      value: Duration.fromObject({ [unit]: value }).toMillis(),
    })),
  ]);

  let shareType = $derived(albumId ? SharedLinkType.Album : SharedLinkType.Individual);

  $effect(() => {
    if (!showMetadata) {
      allowDownload = false;
    }
  });

  if (editingLink) {
    if (editingLink.description) {
      description = editingLink.description;
    }

    password = editingLink.password ?? '';
    slug = editingLink.slug ?? '';
    allowUpload = editingLink.allowUpload;
    allowDownload = editingLink.allowDownload;
    showMetadata = editingLink.showMetadata;

    albumId = editingLink.album?.id;
    assetIds = editingLink.assets.map(({ id }) => id);
  }

  const handleCreateSharedLink = async () => {
    const expirationDate = expirationOption > 0 ? DateTime.now().plus(expirationOption).toISO() : undefined;

    try {
      const data = await createSharedLink({
        sharedLinkCreateDto: {
          type: shareType,
          albumId,
          assetIds,
          expiresAt: expirationDate,
          allowUpload,
          description,
          password,
          allowDownload,
          showMetadata,
          slug,
        },
      });
      onClose(data);
    } catch (error) {
      handleError(error, $t('errors.failed_to_create_shared_link'));
    }
  };

  const handleEditLink = async () => {
    if (!editingLink) {
      return;
    }

    try {
      const expirationDate = expirationOption > 0 ? DateTime.now().plus(expirationOption).toISO() : null;

      await updateSharedLink({
        id: editingLink.id,
        sharedLinkEditDto: {
          description,
          password: password ?? null,
          expiresAt: shouldChangeExpirationTime ? expirationDate : undefined,
          allowUpload,
          allowDownload,
          showMetadata,
          slug: slug.trim() ?? null,
        },
      });

      notificationController.show({
        type: NotificationType.Info,
        message: $t('edited'),
      });

      onClose();
    } catch (error) {
      handleError(error, $t('errors.failed_to_edit_shared_link'));
    }
  };

  const getTitle = () => {
    if (sharedLink) {
      return $t('view_link');
    }
    if (editingLink) {
      return $t('edit_link');
    }
    return $t('create_link_to_share');
  };
</script>

<Modal title={getTitle()} icon={mdiLink} size="small" {onClose}>
  <ModalBody>
    {#if shareType === SharedLinkType.Album}
      {#if !editingLink}
        <div>{$t('album_with_link_access')}</div>
      {:else}
        <div class="text-sm">
          {$t('public_album')} |
          <span class="text-primary">{editingLink.album?.albumName}</span>
        </div>
      {/if}
    {/if}

    {#if shareType === SharedLinkType.Individual}
      {#if !editingLink}
        <div>{$t('create_link_to_share_description')}</div>
      {:else}
        <div class="text-sm">
          {$t('individual_share')} |
          <span class="text-primary">{editingLink.description || ''}</span>
        </div>
      {/if}
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

      <div class="mt-2">
        <SettingSelect
          bind:value={expirationOption}
          options={expiredDateOptions}
          label={$t('expire_after')}
          disabled={editingLink && !shouldChangeExpirationTime}
          number={true}
        />
      </div>

      <Field label={$t('show_metadata')}>
        <Switch bind:checked={showMetadata} />
      </Field>

      <Field label={$t('allow_public_user_to_download')} disabled={!showMetadata}>
        <Switch bind:checked={allowDownload} />
      </Field>

      <Field label={$t('allow_public_user_to_upload')}>
        <Switch bind:checked={allowUpload} />
      </Field>

      {#if editingLink}
        <Field label={$t('change_expiration_time')}>
          <Switch bind:checked={shouldChangeExpirationTime} />
        </Field>
      {/if}
    </div>
  </ModalBody>

  <ModalFooter>
    {#if editingLink}
      <Button fullWidth onclick={handleEditLink}>{$t('confirm')}</Button>
    {:else}
      <Button fullWidth onclick={handleCreateSharedLink}>{$t('create_link')}</Button>
    {/if}
  </ModalFooter>
</Modal>
