<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	import { fly, fade } from 'svelte/transition';
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';

	let message = '';
	let isOpen = false;
	let notificationType = NotificationType.Info;

	$: backgroundColor = () => {
		if (notificationType === NotificationType.Success) {
			return '#dff0d8';
		} else if (notificationType === NotificationType.Error) {
			return '#f2dede';
		} else {
			return '#f5f5f5';
		}
	};

	const unsubscribeMessage = notificationController.notificationMessage.subscribe((msg) => {
		message = msg;
	});

	const unsubscribeIsShow = notificationController.isOpen.subscribe((openState) => {
		isOpen = openState;
	});

	const unsubscribeNotificationType = notificationController.notificationType.subscribe((type) => {
		notificationType = type;
	});

	onDestroy(() => {
		unsubscribeMessage();
		unsubscribeIsShow();
		unsubscribeNotificationType();
	});
</script>

{#if isOpen}
	<div transition:fade={{ duration: 250 }}>
		<div
			style:background-color={backgroundColor()}
			class="absolute inline-block right-5 top-[80px] min-h-[80px] min-w-[200px] max-w-[300px] border border-immich-primary rounded-lg z-[999999] shadow-md p-4"
		>
			<h2 class="font-medium">{notificationType.toString()}</h2>
			<p class="text-sm">{message}</p>
		</div>
	</div>
{/if}
