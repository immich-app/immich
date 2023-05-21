<script lang="ts" context="module">
	export interface MapSettings {
		allowDarkMode: boolean;
		onlyFavorites: boolean;
	}
</script>

<script lang="ts">
	import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
	import { createEventDispatcher } from 'svelte';
	import SettingSwitch from '../admin-page/settings/setting-switch.svelte';
	import Button from '../elements/buttons/button.svelte';

	export let settings: MapSettings;

	const dispatch = createEventDispatcher<{
		close: void;
		save: MapSettings;
	}>();
</script>

<FullScreenModal on:clickOutside={() => dispatch('close')}>
	<div
		class="flex flex-col gap-8 border bg-white dark:bg-immich-dark-gray dark:border-immich-dark-gray p-8 shadow-sm w-96 max-w-lg rounded-3xl"
	>
		<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium self-center">
			Map Settings
		</h1>

		<form on:submit|preventDefault={() => dispatch('save', settings)} class="flex flex-col gap-4">
			<SettingSwitch title="Allow dark mode" bind:checked={settings.allowDarkMode} />
			<SettingSwitch title="Show only favorites" bind:checked={settings.onlyFavorites} />

			<div class="flex w-full gap-4 mt-4">
				<Button color="gray" size="sm" fullwidth on:click={() => dispatch('close')}>Cancel</Button>
				<Button type="submit" size="sm" fullwidth>Save</Button>
			</div>
		</form>
	</div>
</FullScreenModal>
