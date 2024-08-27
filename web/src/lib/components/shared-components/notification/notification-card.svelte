<script lang="ts">
  import { fade } from 'svelte/transition';
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    isComponentNotification,
    notificationController,
    NotificationType,
    type ComponentNotification,
    type Notification,
  } from '$lib/components/shared-components/notification/notification';
  import { onMount } from 'svelte';
  import { mdiCloseCircleOutline, mdiInformationOutline, mdiWindowClose } from '@mdi/js';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';

  export let notification: Notification | ComponentNotification;

  $: icon = notification.type === NotificationType.Error ? mdiCloseCircleOutline : mdiInformationOutline;
  $: hoverStyle = notification.action.type === 'discard' ? 'hover:cursor-pointer' : '';

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

  const buttonStyle: Record<NotificationType, string> = {
    [NotificationType.Info]: 'text-white bg-immich-primary hover:bg-immich-primary/75',
    [NotificationType.Error]: 'text-white bg-immich-error hover:bg-immich-error/75',
    [NotificationType.Warning]: 'text-white bg-immich-warning hover:bg-immich-warning/75',
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

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  transition:fade={{ duration: 250 }}
  style:background-color={backgroundColor[notification.type]}
  style:border-color={borderColor[notification.type]}
  class="border z-[999999] mb-4 min-h-[80px] w-[300px] rounded-2xl p-4 shadow-md {hoverStyle}"
  on:click={handleClick}
  on:keydown={handleClick}
>
  <div class="flex justify-between">
    <div class="flex place-items-center gap-2">
      <Icon path={icon} color={primaryColor[notification.type]} size="20" />
      <h2 style:color={primaryColor[notification.type]} class="font-medium" data-testid="title">
        {#if notification.type == NotificationType.Error}{$t('error')}
        {:else if notification.type == NotificationType.Warning}{$t('warning')}
        {:else if notification.type == NotificationType.Info}{$t('info')}{/if}
      </h2>
    </div>
    <CircleIconButton
      icon={mdiWindowClose}
      title={$t('close')}
      class="dark:text-immich-dark-gray"
      size="20"
      padding="2"
      on:click={discard}
      aria-hidden="true"
      tabindex={-1}
    />
  </div>

  <p class="whitespace-pre-wrap pl-[28px] pr-[16px] text-sm" data-testid="message">
    {#if isComponentNotification(notification)}
      <svelte:component this={notification.component.type} {...notification.component.props} />
    {:else}
      {notification.message}
    {/if}
  </p>

  {#if notification.button}
    <p class="pl-[28px] mt-2.5 text-sm">
      <button
        type="button"
        class="{buttonStyle[notification.type]} rounded px-3 pt-1.5 pb-1 transition-all duration-200"
        on:click={handleButtonClick}
        aria-hidden="true"
        tabindex={-1}
      >
        {notification.button.text}
      </button>
    </p>
  {/if}
</div>
