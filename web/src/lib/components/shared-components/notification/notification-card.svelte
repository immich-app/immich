<script lang="ts">
  import { fade } from 'svelte/transition';
  import CloseCircleOutline from 'svelte-material-icons/CloseCircleOutline.svelte';
  import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
  import WindowClose from 'svelte-material-icons/WindowClose.svelte';

  import {
    ImmichNotification,
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { onMount } from 'svelte';

  export let notificationInfo: ImmichNotification;

  let infoPrimaryColor = '#4250AF';
  let errorPrimaryColor = '#E64132';

  $: icon = notificationInfo.type === NotificationType.Error ? CloseCircleOutline : InformationOutline;

  $: backgroundColor = () => {
    if (notificationInfo.type === NotificationType.Info) {
      return '#E0E2F0';
    }

    if (notificationInfo.type === NotificationType.Error) {
      return '#FBE8E6';
    }
  };

  $: borderStyle = () => {
    if (notificationInfo.type === NotificationType.Info) {
      return '1px solid #D8DDFF';
    }

    if (notificationInfo.type === NotificationType.Error) {
      return '1px solid #F0E8E7';
    }
  };

  $: primaryColor = () => {
    if (notificationInfo.type === NotificationType.Info) {
      return infoPrimaryColor;
    }

    if (notificationInfo.type === NotificationType.Error) {
      return errorPrimaryColor;
    }
  };

  let removeNotificationTimeout: NodeJS.Timeout | undefined = undefined;

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
  class="min-h-[80px] w-[300px] rounded-2xl z-[999999] shadow-md p-4 mb-4 hover:cursor-pointer"
  on:click={handleClick}
  on:keydown={handleClick}
>
  <div class="flex justify-between">
    <div class="flex gap-2 place-items-center">
      <svelte:component this={icon} color={primaryColor()} size="20" />
      <h2 style:color={primaryColor()} class="font-medium" data-testid="title">
        {notificationInfo.type.toString()}
      </h2>
    </div>
    <button on:click|stopPropagation={discard}>
      <svelte:component this={WindowClose} size="20" />
    </button>
  </div>

  <p class="whitespace-pre-wrap text-sm pl-[28px] pr-[16px]" data-testid="message">
    {notificationInfo.message}
  </p>
</div>
