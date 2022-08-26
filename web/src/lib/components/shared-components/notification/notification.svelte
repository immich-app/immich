<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import CloseCircleOutline from 'svelte-material-icons/CloseCircleOutline.svelte';
	import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';

	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';

	let message = '';
	let isOpen = false;
	let notificationType = NotificationType.Info;

	let infoPrimaryColor = '#4250AF';
	let errorPrimaryColor = '#E64132';
	$: icon = notificationType === NotificationType.Error ? CloseCircleOutline : InformationOutline;

	$: backgroundColor = () => {
		if (notificationType === NotificationType.Info) {
			return '#E0E2F0';
		}

		if (notificationType === NotificationType.Error) {
			return '#FBE8E6';
		}
	};

	$: borderStyle = () => {
		if (notificationType === NotificationType.Info) {
			return '1px solid #D8DDFF';
		}

		if (notificationType === NotificationType.Error) {
			return '1px solid #F0E8E7';
		}
	};

	$: primaryColor = () => {
		if (notificationType === NotificationType.Info) {
			return infoPrimaryColor;
		}

		if (notificationType === NotificationType.Error) {
			return errorPrimaryColor;
		}
	};

	const unsubscribeMessage = notificationController.notificationMessage.subscribe((msg) => {
		message = msg;
	});

	const unsubscribeIsOpen = notificationController.isOpen.subscribe((openState) => {
		isOpen = openState;
	});

	const unsubscribeNotificationType = notificationController.notificationType.subscribe((type) => {
		notificationType = type;
	});

	onDestroy(() => {
		unsubscribeMessage();
		unsubscribeIsOpen();
		unsubscribeNotificationType();
	});
</script>

{#if isOpen}
	<div transition:fade={{ duration: 250 }}>
		<div
			style:background-color={backgroundColor()}
			style:border={borderStyle()}
			class="absolute inline-block right-5 top-[80px] min-h-[80px] w-[300px] rounded-2xl z-[999999] shadow-md p-4"
		>
			<div class="flex gap-2 place-items-center">
				<svelte:component this={icon} color={primaryColor()} size="20" />
				<!-- <CloseCircleOutline color={primaryColor()} />
				<InformationOutline color={primaryColor()} /> -->
				<h2 style:color={primaryColor()} class="font-medium">{notificationType.toString()}</h2>
			</div>

			<p class="text-sm pl-[28px] pr-[16px]">{message}</p>
		</div>
	</div>
{/if}
