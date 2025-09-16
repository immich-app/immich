<script lang="ts">
  import {
    isComponentNotification,
    notificationController,
    NotificationType,
    type ComponentNotification,
    type Notification,
  } from '$lib/components/shared-components/notification/notification';
  import { Button, Icon, IconButton, type Color } from '@immich/ui';
  import { mdiCloseCircleOutline, mdiInformationOutline, mdiWindowClose } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  interface Props {
    notification: Notification | ComponentNotification;
  }

  let { notification }: Props = $props();

  let icon = $derived(notification.type === NotificationType.Error ? mdiCloseCircleOutline : mdiInformationOutline);
  let hoverStyle = $derived(notification.action.type === 'discard' ? 'hover:cursor-pointer' : '');

  const backgroundColor: Record<NotificationType, string> = {
    [NotificationType.Info]: '#E0E2F0',
    [NotificationType.Error]: '#FBE8E6',
    [NotificationType.Warning]: '#FFF6DC',
  };

  const borderColor: Record<NotificationType, string> = {
    [NotificationType.Info]: '#D8DDFF',
    [NotificationType.Error]: '#F0E8E7',
    [NotificationType.Warning]: '#FFE6A5',
  };

  const primaryColor: Record<NotificationType, string> = {
    [NotificationType.Info]: '#4250AF',
    [NotificationType.Error]: '#E64132',
    [NotificationType.Warning]: '#D08613',
  };

  const colors: Record<NotificationType, Color> = {
    [NotificationType.Info]: 'primary',
    [NotificationType.Error]: 'danger',
    [NotificationType.Warning]: 'warning',
  };

  onMount(() => {
    const timeoutId = setTimeout(discard, notification.timeout);
    return () => clearTimeout(timeoutId);
  });

  const discard = () => {
    notificationController.removeNotificationById(notification.id);
  };

  const handleClick = () => {
    if (notification.action.type === 'discard') {
      discard();
    }
  };

  const handleButtonClick = () => {
    const button = notification.button;
    if (button) {
      discard();
      return notification.button?.onClick();
    }
  };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  transition:fade={{ duration: 250 }}
  style:background-color={backgroundColor[notification.type]}
  style:border-color={borderColor[notification.type]}
  class="border mb-4 min-h-[80px] w-[300px] rounded-2xl p-4 shadow-md {hoverStyle}"
  onclick={handleClick}
  onkeydown={handleClick}
>
  <div class="flex justify-between">
    <div class="flex place-items-center gap-2">
      <Icon {icon} color={primaryColor[notification.type]} size="20" />
      <h2 style:color={primaryColor[notification.type]} class="font-medium" data-testid="title">
        {#if notification.type == NotificationType.Error}{$t('error')}
        {:else if notification.type == NotificationType.Warning}{$t('warning')}
        {:else if notification.type == NotificationType.Info}{$t('info')}{/if}
      </h2>
    </div>
    <IconButton
      variant="ghost"
      shape="round"
      color="secondary"
      icon={mdiWindowClose}
      aria-label={$t('close')}
      class="dark:text-immich-dark-gray"
      size="medium"
      onclick={discard}
      aria-hidden={true}
      tabindex={-1}
    />
  </div>

  <p class="whitespace-pre-wrap ps-[28px] pe-[16px] text-sm text-black/80" data-testid="message">
    {#if isComponentNotification(notification)}
      <notification.component.type {...notification.component.props} />
    {:else}
      {notification.message}
    {/if}
  </p>

  {#if notification.button}
    <p class="ps-[28px] mt-2.5 light text-light">
      <Button
        size="small"
        color={colors[notification.type]}
        onclick={handleButtonClick}
        aria-hidden="true"
        tabindex={-1}
      >
        {notification.button.text}
      </Button>
    </p>
  {/if}
</div>
