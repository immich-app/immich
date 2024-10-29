<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { copyToClipboard, makeSharedLinkUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { SharedLinkType, createSharedLink, updateSharedLink, type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiContentCopy, mdiLink } from '@mdi/js';
  import { NotificationType, notificationController } from '../notification/notification';
  import SettingInputField, { SettingInputFieldType } from '../settings/setting-input-field.svelte';
  import SettingSwitch from '../settings/setting-switch.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { t } from 'svelte-i18n';
  import { locale } from '$lib/stores/preferences.store';
  import { DateTime, Duration } from 'luxon';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';

  export let onClose: () => void;
  export let albumId: string | undefined = undefined;
  export let assetIds: string[] = [];
  export let editingLink: SharedLinkResponseDto | undefined = undefined;
  export let onCreated: () => void = () => {};

  let sharedLink: string | null = null;
  let description = '';
  let allowDownload = true;
  let allowUpload = false;
  let showMetadata = true;
  let expirationOption: number = 0;
  let password = '';
  let shouldChangeExpirationTime = false;
  let enablePassword = false;

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

  $: relativeTime = new Intl.RelativeTimeFormat($locale);
  $: expiredDateOptions = [
    { text: $t('never'), value: 0 },
    ...expirationOptions.map(([value, unit]) => ({
      text: relativeTime.format(value, unit),
      value: Duration.fromObject({ [unit]: value }).toMillis(),
    })),
  ];

  $: shareType = albumId ? SharedLinkType.Album : SharedLinkType.Individual;
  $: {
    if (!showMetadata) {
      allowDownload = false;
    }
  }
  if (editingLink) {
    if (editingLink.description) {
      description = editingLink.description;
    }
    if (editingLink.password) {
      password = editingLink.password;
    }
    allowUpload = editingLink.allowUpload;
    allowDownload = editingLink.allowDownload;
    showMetadata = editingLink.showMetadata;

    albumId = editingLink.album?.id;
    assetIds = editingLink.assets.map(({ id }) => id);

    enablePassword = !!editingLink.password;
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
        },
      });
      sharedLink = makeSharedLinkUrl($serverConfig.externalDomain, data.key);
      onCreated();
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
          password: enablePassword ? password : '',
          expiresAt: shouldChangeExpirationTime ? expirationDate : undefined,
          allowUpload,
          allowDownload,
          showMetadata,
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
    if (editingLink) {
      return $t('edit_link');
    }
    return $t('create_link_to_share');
  };
</script>

<FullScreenModal title={getTitle()} icon={mdiLink} {onClose}>
  <section>
    {#if shareType === SharedLinkType.Album}
      {#if !editingLink}
        <div>{$t('album_with_link_access')}</div>
      {:else}
        <div class="text-sm">
          {$t('public_album')} |
          <span class="text-immich-primary dark:text-immich-dark-primary">{editingLink.album?.albumName}</span>
        </div>
      {/if}
    {/if}

    {#if shareType === SharedLinkType.Individual}
      {#if !editingLink}
        <div>{$t('create_link_to_share_description')}</div>
      {:else}
        <div class="text-sm">
          {$t('individual_share')} |
          <span class="text-immich-primary dark:text-immich-dark-primary">{editingLink.description || ''}</span>
        </div>
      {/if}
    {/if}

    <div class="mb-2 mt-4">
      <p class="text-xs">{$t('link_options').toUpperCase()}</p>
    </div>
    <div class="rounded-lg bg-gray-100 p-4 dark:bg-black/40 overflow-y-auto">
      <div class="flex flex-col">
        <div class="mb-2">
          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label={$t('description')}
            bind:value={description}
          />
        </div>

        <div class="mb-2">
          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label={$t('password')}
            bind:value={password}
            disabled={!enablePassword}
          />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={enablePassword} title={$t('require_password')} />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={showMetadata} title={$t('show_metadata')} />
        </div>

        <div class="my-3">
          <SettingSwitch
            bind:checked={allowDownload}
            title={$t('allow_public_user_to_download')}
            disabled={!showMetadata}
          />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={allowUpload} title={$t('allow_public_user_to_upload')} />
        </div>

        {#if editingLink}
          <div class="my-3">
            <SettingSwitch bind:checked={shouldChangeExpirationTime} title={$t('change_expiration_time')} />
          </div>
        {/if}
        <div class="mt-3">
          <SettingSelect
            bind:value={expirationOption}
            options={expiredDateOptions}
            label={$t('expire_after')}
            disabled={editingLink && !shouldChangeExpirationTime}
            number={true}
          />
        </div>
      </div>
    </div>
  </section>

  <svelte:fragment slot="sticky-bottom">
    {#if !sharedLink}
      {#if editingLink}
        <Button size="sm" fullwidth on:click={handleEditLink}>{$t('confirm')}</Button>
      {:else}
        <Button size="sm" fullwidth on:click={handleCreateSharedLink}>{$t('create_link')}</Button>
      {/if}
    {:else}
      <div class="flex w-full gap-2">
        <input class="immich-form-input w-full" bind:value={sharedLink} disabled />
        <LinkButton on:click={() => (sharedLink ? copyToClipboard(sharedLink) : '')}>
          <div class="flex place-items-center gap-2 text-sm">
            <Icon path={mdiContentCopy} ariaLabel={$t('copy_link_to_clipboard')} size="18" />
          </div>
        </LinkButton>
      </div>
    {/if}
  </svelte:fragment>
</FullScreenModal>
