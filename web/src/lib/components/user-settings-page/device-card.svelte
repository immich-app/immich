<script lang="ts">
	import { locale } from '$lib/stores/preferences.store';
	import { AuthDeviceResponseDto } from '@api';
	import { DateTime, ToRelativeCalendarOptions } from 'luxon';
	import { createEventDispatcher } from 'svelte';
	import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';

	export let device: AuthDeviceResponseDto;

	const dispatcher = createEventDispatcher();

	const options: ToRelativeCalendarOptions = {
		unit: 'days',
		locale: $locale
	};
</script>

<div class="flex flex-row w-full">
	<!-- TODO: Device Image -->
	<!-- <div class="w-16 h-16 bg-immich-dark-primary" /> -->
	<div class="flex flex-row grow justify-between gap-1">
		<div class="flex flex-col gap-1 justify-center dark:text-white">
			<span class="px-4 text-sm">
				{#if device.deviceType || device.deviceOS}
					<span>{device.deviceOS || 'Unknown'}, {device.deviceType || 'Unknown'}</span>
				{:else}
					<span>Unknown</span>
				{/if}
			</span>
			<div class="text-sm px-4">
				<span class="text-immich-primary dark:text-immich-dark-primary">Last seen</span>
				<span>{DateTime.fromISO(device.updatedAt).toRelativeCalendar(options)}</span>
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
