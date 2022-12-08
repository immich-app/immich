<script lang="ts">
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, SystemConfigUpdateDto } from '@api';
	import { onMount } from 'svelte';

	let isSaving = false;
	let items: Array<{ key: string; value: string; originalValue: string }> = [];

	const refreshConfig = async () => {
		const { data } = await api.systemConfigApi.getConfig();

		// items = Object.entries(ffmpegConfig).map(([key, value]) => ({
		// 	key,
		// 	value,
		// 	originalValue: value
		// }));
	};

	onMount(() => refreshConfig());

	const handleSave = async () => {
		try {
			isSaving = true;
			const update: SystemConfigUpdateDto = {};
			for (const item of items) {
				if (item.value !== item.originalValue) {
					// update[item.key as keyof SystemConfigUpdateDto] = item.value;
				}
			}
			if (Object.keys(update).length > 0) {
				await api.systemConfigApi.updateConfig(update);
				refreshConfig();
			}

			notificationController.show({
				message: `Saved settings`,
				type: NotificationType.Info
			});
		} catch (e) {
			console.error('Error [updateSystemConfig]', e);
			notificationController.show({
				message: `Unable to save changes.`,
				type: NotificationType.Error
			});
		} finally {
			isSaving = false;
		}
	};
</script>

<section>
	<table class="text-left my-4 w-full">
		<thead
			class="border rounded-md mb-4 bg-gray-50 flex text-immich-primary h-12 dark:bg-immich-dark-gray dark:text-immich-dark-primary dark:border-immich-dark-gray"
		>
			<tr class="flex w-full place-items-center">
				<th class="text-center w-1/2 font-medium text-sm">Setting</th>
				<th class="text-center w-1/2 font-medium text-sm">Value</th>
			</tr>
		</thead>
		<tbody class="rounded-md block border dark:border-immich-dark-gray">
			{#each items as item, i}
				<tr
					class={`text-center flex place-items-center w-full h-[80px] dark:text-immich-dark-fg ${
						i % 2 == 0 ? 'bg-slate-50 dark:bg-[#181818]' : 'bg-immich-bg dark:bg-immich-dark-bg'
					}`}
				>
					<td class="text-sm px-4 w-1/2 text-ellipsis">
						{item.key}
					</td>
					<td class="text-sm px-4 w-1/2 text-ellipsis">
						<input
							style="text-align: center"
							class="w-full immich-form-input"
							id={item.key}
							disabled={isSaving}
							name={item.key}
							type="text"
							bind:value={item.value}
						/>
						<!-- placeholder={item.defaultValue + ''} -->
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<div class="flex justify-end">
		<button
			on:click={handleSave}
			class="px-6 py-3 text-sm bg-immich-primary dark:bg-immich-dark-primary font-medium rounded-2xl hover:bg-immich-primary/50 transition-all hover:cursor-pointer disabled:cursor-not-allowed shadow-sm text-immich-bg dark:text-immich-dark-gray"
			disabled={isSaving}
		>
			{#if isSaving}
				<LoadingSpinner />
			{:else}
				Save
			{/if}
		</button>
	</div>
</section>
