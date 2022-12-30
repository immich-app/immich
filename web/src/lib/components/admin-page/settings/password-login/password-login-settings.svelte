<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, SystemConfigPasswordLoginDto } from '@api';
	import _ from 'lodash';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import { fade } from 'svelte/transition';
	import SettingSwitch from '../setting-switch.svelte';
	import { handleError } from '../../../../utils/handle-error';

	export let passwordLoginConfig: SystemConfigPasswordLoginDto; // this is the config that is being edited

	let savedConfig: SystemConfigPasswordLoginDto;
	let defaultConfig: SystemConfigPasswordLoginDto;

	async function getConfigs() {
		[savedConfig, defaultConfig] = await Promise.all([
			api.systemConfigApi.getConfig().then((res) => res.data.passwordLogin),
			api.systemConfigApi.getDefaults().then((res) => res.data.passwordLogin)
		]);
	}

	async function saveSetting() {
		try {
			const { data: configs } = await api.systemConfigApi.getConfig();

			const result = await api.systemConfigApi.updateConfig({
				...configs,
				passwordLogin: passwordLoginConfig
			});

			passwordLoginConfig = { ...result.data.passwordLogin };
			savedConfig = { ...result.data.passwordLogin };

			notificationController.show({
				message: 'Settings saved',
				type: NotificationType.Info
			});
		} catch (error) {
			handleError(error, 'Unable to save settings');
		}
	}

	async function reset() {
		const { data: resetConfig } = await api.systemConfigApi.getConfig();

		passwordLoginConfig = { ...resetConfig.passwordLogin };
		savedConfig = { ...resetConfig.passwordLogin };

		notificationController.show({
			message: 'Reset settings to the recent saved settings',
			type: NotificationType.Info
		});
	}

	async function resetToDefault() {
		const { data: configs } = await api.systemConfigApi.getDefaults();

		passwordLoginConfig = { ...configs.passwordLogin };
		defaultConfig = { ...configs.passwordLogin };

		notificationController.show({
			message: 'Reset FFmpeg settings to default',
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
						<SettingSwitch
							title="ENABLED"
							subtitle="Login with email and password"
							bind:checked={passwordLoginConfig.enabled}
						/>

						<SettingButtonsRow
							on:reset={reset}
							on:save={saveSetting}
							on:reset-to-default={resetToDefault}
							showResetToDefault={!_.isEqual(savedConfig, defaultConfig)}
						/>
					</div>
				</div>
			</form>
		</div>
	{/await}
</div>
