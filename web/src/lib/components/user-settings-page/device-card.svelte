<script lang="ts">
	import { locale } from '$lib/stores/preferences.store';
	import type { AuthDeviceResponseDto } from '@api';
	import { DateTime, ToRelativeCalendarOptions } from 'luxon';
	import { createEventDispatcher } from 'svelte';
	import Android from 'svelte-material-icons/Android.svelte';
	import Apple from 'svelte-material-icons/Apple.svelte';
	import AppleSafari from 'svelte-material-icons/AppleSafari.svelte';
	import GoogleChrome from 'svelte-material-icons/GoogleChrome.svelte';
	import Help from 'svelte-material-icons/Help.svelte';
	import Linux from 'svelte-material-icons/Linux.svelte';
	import MicrosoftWindows from 'svelte-material-icons/MicrosoftWindows.svelte';
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
	<div
		class="hidden sm:flex pr-2 justify-center items-center text-immich-primary dark:text-immich-dark-primary"
	>
		{#if device.deviceOS === 'Android'}
			<Android size="40" />
		{:else if device.deviceOS === 'iOS' || device.deviceOS === 'Mac OS'}
			<Apple size="40" />
		{:else if device.deviceOS.indexOf('Safari') !== -1}
			<AppleSafari size="40" />
		{:else if device.deviceOS.indexOf('Windows') !== -1}
			<MicrosoftWindows size="40" />
		{:else if device.deviceOS === 'Linux'}
			<Linux size="40" />
		{:else if device.deviceOS === 'Chromium OS' || device.deviceType === 'Chrome' || device.deviceType === 'Chromium'}
			<GoogleChrome size="40" />
		{:else}
			<Help size="40" />
		{/if}
	</div>
	<div class="pl-4 sm:pl-0 flex flex-row grow justify-between gap-1">
		<div class="flex flex-col gap-1 justify-center dark:text-white">
			<span class="text-sm">
				{#if device.deviceType || device.deviceOS}
					<span>{device.deviceOS || 'Unknown'} • {device.deviceType || 'Unknown'}</span>
				{:else}
					<span>Unknown</span>
				{/if}
			</span>
			<div class="text-sm">
				<span class="">Last seen</span>
				<span>{DateTime.fromISO(device.updatedAt).toRelativeCalendar(options)}</span>
			</div>
		</div>
		{#if !device.current}
			<div class="text-sm flex flex-col justify-center">
				<button
					on:click={() => dispatcher('delete')}
					class="bg-immich-primary dark:bg-immich-dark-primary text-gray-100 dark:text-gray-700 rounded-full p-3 transition-all duration-150 hover:bg-immich-primary/75"
					title="Log out"
				>
					<TrashCanOutline size="16" />
				</button>
			</div>
		{/if}
	</div>
</div>
