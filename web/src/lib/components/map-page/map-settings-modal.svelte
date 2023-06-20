<script lang="ts">
	import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
	import type { MapSettings } from '$lib/stores/preferences.store';
	import { Duration } from 'luxon';
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	import SettingSelect from '../admin-page/settings/setting-select.svelte';
	import SettingSwitch from '../admin-page/settings/setting-switch.svelte';
	import Button from '../elements/buttons/button.svelte';
	import LinkButton from '../elements/buttons/link-button.svelte';

	export let settings: MapSettings;
	let customDateRange = !!settings.dateAfter || !!settings.dateBefore;

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

		<form
			on:submit|preventDefault={() => dispatch('save', settings)}
			class="flex flex-col gap-4 text-immich-primary dark:text-immich-dark-primary"
		>
			<SettingSwitch title="Allow dark mode" bind:checked={settings.allowDarkMode} />
			<SettingSwitch title="Only favorites" bind:checked={settings.onlyFavorites} />
			{#if customDateRange}
				<div in:fly={{ y: 10, duration: 200 }} class="flex flex-col gap-4">
					<div class="flex justify-between items-center gap-8">
						<label class="immich-form-label text-sm shrink-0" for="date-after">Date after</label>
						<input
							class="immich-form-input w-40"
							type="date"
							id="date-after"
							max={settings.dateBefore}
							bind:value={settings.dateAfter}
						/>
					</div>
					<div class="flex justify-between items-center gap-8">
						<label class="immich-form-label text-sm shrink-0" for="date-before">Date before</label>
						<input
							class="immich-form-input w-40"
							type="date"
							id="date-before"
							bind:value={settings.dateBefore}
						/>
					</div>
					<div class="flex justify-center text-xs">
						<LinkButton
							on:click={() => {
								customDateRange = false;
								settings.dateAfter = '';
								settings.dateBefore = '';
							}}
						>
							Remove custom date range
						</LinkButton>
					</div>
				</div>
			{:else}
				<div in:fly={{ y: -10, duration: 200 }} class="flex flex-col gap-1">
					<SettingSelect
						label="Date range"
						name="date-range"
						bind:value={settings.relativeDate}
						options={[
							{
								value: '',
								text: 'All'
							},
							{
								value: Duration.fromObject({ hours: 24 }).toISO() || '',
								text: 'Past 24 hours'
							},
							{
								value: Duration.fromObject({ days: 7 }).toISO() || '',
								text: 'Past 7 days'
							},
							{
								value: Duration.fromObject({ days: 30 }).toISO() || '',
								text: 'Past 30 days'
							},
							{
								value: Duration.fromObject({ years: 1 }).toISO() || '',
								text: 'Past year'
							},
							{
								value: Duration.fromObject({ years: 3 }).toISO() || '',
								text: 'Past 3 years'
							}
						]}
					/>
					<div class="text-xs">
						<LinkButton
							on:click={() => {
								customDateRange = true;
								settings.relativeDate = '';
							}}
						>
							Use custom date range instead
						</LinkButton>
					</div>
				</div>
			{/if}

			<div class="flex w-full gap-4 mt-4">
				<Button color="gray" size="sm" fullwidth on:click={() => dispatch('close')}>Cancel</Button>
				<Button type="submit" size="sm" fullwidth>Save</Button>
			</div>
		</form>
	</div>
</FullScreenModal>
