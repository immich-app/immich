<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, SystemConfigDisplayDto } from '@api';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import { isEqual } from 'lodash-es';
	import { fade } from 'svelte/transition';
	import SettingColorField from '../setting-color-field.svelte';
	import { accentColors } from '$lib/stores/preferences.store';

	export let displayConfig: SystemConfigDisplayDto;

	let savedConfig: SystemConfigDisplayDto;
	let defaultConfig: SystemConfigDisplayDto;

	function updateColors() {
		$accentColors.accentColor = displayConfig.accentColor ? displayConfig.accentColor : undefined;
		$accentColors.darkAccentColor = displayConfig.darkAccentColor
			? displayConfig.darkAccentColor
			: undefined;
	}

	async function getConfigs() {
		[savedConfig, defaultConfig] = await Promise.all([
			api.systemConfigApi.getConfig().then((res) => res.data.display),
			api.systemConfigApi.getDefaults().then((res) => res.data.display)
		]);
	}

	async function saveSetting() {
		try {
			const { data: configs } = await api.systemConfigApi.getConfig();

			const result = await api.systemConfigApi.updateConfig({
				systemConfigDto: {
					...configs,
					display: displayConfig
				}
			});

			displayConfig = { ...result.data.display };
			savedConfig = { ...result.data.display };

			updateColors();

			notificationController.show({
				message: 'Display settings saved',
				type: NotificationType.Info
			});
		} catch (e) {
			console.error('Error [display-settings] [saveSetting]', e);
			notificationController.show({
				message: 'Unable to save settings',
				type: NotificationType.Error
			});
		}
	}

	async function reset() {
		const { data: resetConfig } = await api.systemConfigApi.getConfig();

		displayConfig = { ...resetConfig.display };
		savedConfig = { ...resetConfig.display };

		notificationController.show({
			message: 'Reset display settings to the recent saved settings',
			type: NotificationType.Info
		});
	}

	async function resetToDefault() {
		const { data: configs } = await api.systemConfigApi.getDefaults();

		displayConfig = { ...configs.display };
		defaultConfig = { ...configs.display };

		notificationController.show({
			message: 'Reset display settings to default',
			type: NotificationType.Info
		});
	}
</script>

<div>
	{#await getConfigs() then}
		<div in:fade={{ duration: 500 }}>
			<form autocomplete="off" on:submit|preventDefault>
				<div class="flex flex-col gap-4 ml-4 mt-4">
					<div class="ml-4">
						<SettingColorField label="ACCENT COLOR" bind:value={displayConfig.accentColor} />
						<SettingColorField
							label="DARK ACCENT COLOR"
							bind:value={displayConfig.darkAccentColor}
						/>

						<div class="ml-4">
							<SettingButtonsRow
								on:reset={reset}
								on:save={saveSetting}
								on:reset-to-default={resetToDefault}
								showResetToDefault={!isEqual(savedConfig, defaultConfig)}
							/>
						</div>
					</div>
				</div>
			</form>
		</div>
	{/await}
</div>
