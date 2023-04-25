<script lang="ts">
	import { locale } from '$lib/stores/preferences.store';
	import { AuthDeviceResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';
	import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';

	export let device: AuthDeviceResponseDto;

	const dispatcher = createEventDispatcher();

	const format: Intl.DateTimeFormatOptions = {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	};
</script>

<div class="flex flex-row w-full">
	<!-- TODO: Device Image -->
	<!-- <div class="w-16 h-16 bg-immich-dark-primary" /> -->
	<div class="flex flex-row grow justify-between gap-1">
		<div class="flex flex-col gap-1 justify-center dark:text-white">
			{#if device.deviceType && device.deviceOS}
				<p class="px-4">
					<span class="text-sm">{device.deviceOS}, {device.deviceType}</span>
				</p>
			{:else}
				<p class="text-sm px-4">
					<span class="font-bold">ID: </span>
					<span>{device.id}</span>
				</p>
			{/if}
			<div class="text-sm px-4">
				<span class="text-immich-primary dark:text-immich-dark-primary">Login since</span>
				<span>{new Date(device.createdAt).toLocaleDateString($locale, format)}</span>
			</div>
		</div>
		{#if !device.current}
			<div class="text-sm px-4 flex flex-col justify-center">
				<button
					on:click={() => dispatcher('delete')}
					class="bg-immich-primary dark:bg-immich-dark-primary text-gray-100 dark:text-gray-700  rounded-full p-3 transition-all duration-150 hover:bg-immich-primary/75"
					title="Logout"
				>
					<TrashCanOutline size="16" />
				</button>
			</div>
		{/if}
	</div>
</div>
