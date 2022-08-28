<script lang="ts">
	import { fade } from 'svelte/transition';
	import CloseCircleOutline from 'svelte-material-icons/CloseCircleOutline.svelte';
	import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';

	import {
		ImmichNotification,
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { onMount } from 'svelte';

	export let notificationInfo: ImmichNotification;

	let infoPrimaryColor = '#4250AF';
	let errorPrimaryColor = '#E64132';

	$: icon =
		notificationInfo.type === NotificationType.Error ? CloseCircleOutline : InformationOutline;

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

	onMount(() => {
		setTimeout(() => {
			notificationController.removeNotificationById(notificationInfo.id);
		}, notificationInfo.timeout);
	});
</script>

<div
	transition:fade={{ duration: 250 }}
	style:background-color={backgroundColor()}
	style:border={borderStyle()}
	class="min-h-[80px] w-[300px] rounded-2xl z-[999999] shadow-md p-4 mb-4"
>
	<div class="flex gap-2 place-items-center">
		<svelte:component this={icon} color={primaryColor()} size="20" />
		<h2 style:color={primaryColor()} class="font-medium">{notificationInfo.type.toString()}</h2>
	</div>

	<p class="text-sm pl-[28px] pr-[16px]">{notificationInfo.message}</p>
</div>
