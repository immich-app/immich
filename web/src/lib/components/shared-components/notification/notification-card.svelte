<script lang="ts">
  import { fade } from 'svelte/transition';
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    ImmichNotification,
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { onMount } from 'svelte';
  import { mdiCloseCircleOutline, mdiInformationOutline, mdiWindowClose } from '@mdi/js';

  export let notificationInfo: ImmichNotification;

  let infoPrimaryColor = '#4250AF';
  let errorPrimaryColor = '#E64132';
  let warningPrimaryColor = '#D08613';

  $: icon = notificationInfo.type === NotificationType.Error ? mdiCloseCircleOutline : mdiInformationOutline;

  $: backgroundColor = () => {
    if (notificationInfo.type === NotificationType.Info) {
      return '#E0E2F0';
    }

    if (notificationInfo.type === NotificationType.Error) {
      return '#FBE8E6';
    }

    if (notificationInfo.type === NotificationType.Warning) {
      return '#FFF6DC';
    }
  };

  $: borderStyle = () => {
    if (notificationInfo.type === NotificationType.Info) {
      return '1px solid #D8DDFF';
    }

    if (notificationInfo.type === NotificationType.Error) {
      return '1px solid #F0E8E7';
    }

    if (notificationInfo.type === NotificationType.Warning) {
      return '1px solid #FFE6A5';
    }
  };

  $: primaryColor = () => {
    if (notificationInfo.type === NotificationType.Info) {
      return infoPrimaryColor;
    }

    if (notificationInfo.type === NotificationType.Error) {
      return errorPrimaryColor;
    }

    if (notificationInfo.type === NotificationType.Warning) {
      return warningPrimaryColor;
    }
  };

  let removeNotificationTimeout: NodeJS.Timeout | undefined;

  onMount(() => {
    removeNotificationTimeout = setTimeout(discard, notificationInfo.timeout);
    return () => clearTimeout(removeNotificationTimeout);
  });

  const discard = () => {
    notificationController.removeNotificationById(notificationInfo.id);
  };

  const handleClick = () => {
    const action = notificationInfo.action;
    if (action.type == 'discard') {
      discard();
    } else if (action.type == 'link') {
      window.open(action.target);
    }
  };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  transition:fade={{ duration: 250 }}
  style:background-color={backgroundColor()}
  style:border={borderStyle()}
  class="z-[999999] mb-4 min-h-[80px] w-[300px] rounded-2xl p-4 shadow-md hover:cursor-pointer"
  on:click={handleClick}
  on:keydown={handleClick}
>
  <div class="flex justify-between">
    <div class="flex place-items-center gap-2">
      <Icon path={icon} color={primaryColor()} size="20" />
      <h2 style:color={primaryColor()} class="font-medium" data-testid="title">
        {notificationInfo.type.toString()}
      </h2>
    </div>
    <button on:click|stopPropagation={discard}>
      <Icon path={mdiWindowClose} size="20" />
    </button>
  </div>

  <p class="whitespace-pre-wrap pl-[28px] pr-[16px] text-sm" data-testid="message">
    {notificationInfo.message}
  </p>
</div>
