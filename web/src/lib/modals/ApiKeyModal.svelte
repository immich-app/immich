<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import ApiKeyGrid from '$lib/components/user-settings-page/api-key-grid.svelte';
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import Checkbox from '$lib/components/elements/checkbox.svelte';
  import { Permission } from '@immich/sdk';
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    apiKey: { name: string };
    title: string;
    cancelText?: string;
    submitText?: string;
    onClose: (apiKey?: { name: string }) => void;
  }

  let { apiKey = $bindable(), title, cancelText = $t('cancel'), submitText = $t('save'), onClose }: Props = $props();

  let selectAllPermissions = $state(false);

  const permissions: Map<string, string[]> = new Map();

  permissions.set('activity', [
    Permission.ActivityCreate,
    Permission.ActivityRead,
    Permission.ActivityUpdate,
    Permission.ActivityDelete,
    Permission.ActivityStatistics,
  ]);

  permissions.set('api_key', [
    Permission.ApiKeyCreate,
    Permission.ApiKeyRead,
    Permission.ApiKeyUpdate,
    Permission.ApiKeyDelete,
  ]);

  permissions.set('asset', [
    Permission.AssetRead,
    Permission.AssetUpdate,
    Permission.AssetDelete,
    Permission.AssetShare,
    Permission.AssetView,
    Permission.AssetDownload,
    Permission.AssetUpload,
  ]);

  permissions.set('album', [
    Permission.AlbumCreate,
    Permission.AlbumRead,
    Permission.AlbumUpdate,
    Permission.AlbumDelete,
    Permission.AlbumStatistics,

    Permission.AlbumAddAsset,
    Permission.AlbumRemoveAsset,
    Permission.AlbumShare,
    Permission.AlbumDownload,
  ]);

  permissions.set('auth_device', [
    Permission.AuthDeviceDelete,
  ]);

  permissions.set('archive', [
    Permission.ArchiveRead,
  ]);

  permissions.set('face', [
    Permission.FaceCreate,
    Permission.FaceRead,
    Permission.FaceUpdate,
    Permission.FaceDelete,
  ]);

  permissions.set('library', [
    Permission.LibraryCreate,
    Permission.LibraryRead,
    Permission.LibraryUpdate,
    Permission.LibraryDelete,
    Permission.LibraryStatistics,
  ]);

  permissions.set('timeline', [
    Permission.TimelineRead,
    Permission.TimelineDownload,
  ]);

  permissions.set('memory', [
    Permission.MemoryCreate,
    Permission.MemoryRead,
    Permission.MemoryUpdate,
    Permission.MemoryDelete,
  ]);

  permissions.set('notification', [
    Permission.NotificationCreate,
    Permission.NotificationRead,
    Permission.NotificationUpdate,
    Permission.NotificationDelete,
  ]);

  permissions.set('partner', [
    Permission.PartnerCreate,
    Permission.PartnerRead,
    Permission.PartnerUpdate,
    Permission.PartnerDelete,
  ]);

  permissions.set('person', [
    Permission.PersonCreate,
    Permission.PersonRead,
    Permission.PersonUpdate,
    Permission.PersonDelete,
    Permission.PersonStatistics,
    Permission.PersonMerge,
    Permission.PersonReassign,
  ]);

  permissions.set('session', [
    Permission.SessionRead,
    Permission.SessionUpdate,
    Permission.SessionDelete,
  ]);

  permissions.set('sharedLink', [
    Permission.SharedLinkCreate,
    Permission.SharedLinkRead,
    Permission.SharedLinkUpdate,
    Permission.SharedLinkDelete,
  ]);

  permissions.set('stack', [
    Permission.StackCreate,
    Permission.StackRead,
    Permission.StackUpdate,
    Permission.StackDelete,
  ]);

  permissions.set('systemConfig', [
    Permission.SystemConfigRead,
    Permission.SystemConfigUpdate,
  ]);

  permissions.set('systemMetadata', [
    Permission.SystemMetadataRead,
    Permission.SystemMetadataUpdate,
  ]);

  permissions.set('tag', [
    Permission.TagCreate,
    Permission.TagRead,
    Permission.TagUpdate,
    Permission.TagDelete,
    Permission.TagAsset,
  ]);

  permissions.set('adminUser', [
    Permission.AdminUserCreate,
    Permission.AdminUserRead,
    Permission.AdminUserUpdate,
    Permission.AdminUserDelete,
  ]);

  const handleSubmit = () => {
    if (apiKey.name) {
      onClose({ name: apiKey.name });
    } else {
      notificationController.show({
        message: $t('api_key_empty'),
        type: NotificationType.Warning,
      });
    }
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
    handleSubmit();
  };
</script>

<Modal {title} icon={mdiKeyVariant} {onClose} size="large">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="api-key-form">
      <div class="mb-4 flex flex-col gap-2">
        <label class="immich-form-label" for="name">{$t('name')}</label>
        <input class="immich-form-input" id="name" name="name" type="text" bind:value={apiKey.name} />
      </div>
      <Checkbox
        id = ""
        label={$t("select_all")}
        labelClass="text-sm dark:text-immich-dark-fg"
        bind:checked={selectAllPermissions}
      />
      {#each permissions as [permissionTitle, permissionContent]}
        <ApiKeyGrid title={permissionTitle} content={permissionContent} />
      {/each}
    </form>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-3 w-full">
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{cancelText}</Button>
      <Button shape="round" type="submit" fullWidth form="api-key-form">{submitText}</Button>
    </div>
  </ModalFooter>
</Modal>
