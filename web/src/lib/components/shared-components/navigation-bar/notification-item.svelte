<script lang="ts">
  import { NotificationLevel, NotificationType, type NotificationDto } from '@immich/sdk';
  import { IconButton, Stack, Text } from '@immich/ui';
  import { mdiBackupRestore, mdiInformationOutline, mdiMessageBadgeOutline, mdiSync } from '@mdi/js';
  import { DateTime } from 'luxon';

  interface Props {
    notification: NotificationDto;
    onclick: (id: string) => void;
  }

  let { notification, onclick }: Props = $props();

  const getAlertColor = (level: NotificationLevel) => {
    switch (level) {
      case NotificationLevel.Error: {
        return 'danger';
      }
      case NotificationLevel.Warning: {
        return 'warning';
      }
      case NotificationLevel.Info: {
        return 'primary';
      }
      case NotificationLevel.Success: {
        return 'success';
      }
      default: {
        return 'primary';
      }
    }
  };

  const getIconBgColor = (level: NotificationLevel) => {
    switch (level) {
      case NotificationLevel.Error: {
        return 'bg-red-500 dark:bg-red-300 dark:hover:bg-red-200';
      }
      case NotificationLevel.Warning: {
        return 'bg-amber-500 dark:bg-amber-200 dark:hover:bg-amber-200';
      }
      case NotificationLevel.Info: {
        return 'bg-blue-500 dark:bg-blue-200 dark:hover:bg-blue-200';
      }
      case NotificationLevel.Success: {
        return 'bg-green-500 dark:bg-green-200 dark:hover:bg-green-200';
      }
    }
  };

  const getIconType = (type: NotificationType) => {
    switch (type) {
      case NotificationType.BackupFailed: {
        return mdiBackupRestore;
      }
      case NotificationType.JobFailed: {
        return mdiSync;
      }
      case NotificationType.SystemMessage: {
        return mdiMessageBadgeOutline;
      }
      case NotificationType.Custom: {
        return mdiInformationOutline;
      }
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    try {
      const date = DateTime.fromISO(dateString);
      if (!date.isValid) {
        return dateString; // Return original string if parsing fails
      }
      // Use Luxon's toRelative with the current locale
      return date.setLocale('en').toRelative() || dateString;
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return dateString; // Fallback to original string on error
    }
  };
</script>

<button
  class="min-h-[80px] p-2 py-3 hover:bg-immich-primary/10 dark:hover:bg-immich-dark-primary/10 border-b border-gray-200 dark:border-immich-dark-gray w-full"
  type="button"
  onclick={() => onclick(notification.id)}
  title={notification.createdAt}
>
  <div class="grid grid-cols-[56px_1fr_32px] items-center gap-2">
    <div class="flex place-items-center place-content-center">
      <IconButton
        icon={getIconType(notification.type)}
        color={getAlertColor(notification.level)}
        aria-label={notification.title}
        shape="round"
        class={getIconBgColor(notification.level)}
        size="small"
      ></IconButton>
    </div>

    <Stack class="text-left" gap={1}>
      <Text size="tiny" class="uppercase text-black dark:text-white font-semibold">{notification.title}</Text>
      {#if notification.description}
        <Text class="overflow-hidden text-gray-600 dark:text-gray-300">{notification.description}</Text>
      {/if}

      <Text size="tiny" color="muted">{formatRelativeTime(notification.createdAt)}</Text>
    </Stack>

    {#if !notification.readAt}
      <div class="w-2 h-2 rounded-full bg-primary text-right justify-self-center"></div>
    {/if}
  </div>
</button>
