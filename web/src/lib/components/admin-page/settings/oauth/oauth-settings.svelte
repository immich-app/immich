<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, SystemConfigOAuthDto } from '@api';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
	import SettingSwitch from '../setting-switch.svelte';
	import _ from 'lodash';
	import { fade } from 'svelte/transition';

	export let oauthConfig: SystemConfigOAuthDto;

	let savedConfig: SystemConfigOAuthDto;
	let defaultConfig: SystemConfigOAuthDto;

	async function getConfigs() {
		[savedConfig, defaultConfig] = await Promise.all([
			api.systemConfigApi.getConfig().then((res) => res.data.oauth),
			api.systemConfigApi.getDefaults().then((res) => res.data.oauth)
		]);
	}

	async function reset() {
		const { data: resetConfig } = await api.systemConfigApi.getConfig();

		oauthConfig = resetConfig.oauth;
		savedConfig = resetConfig.oauth;

		notificationController.show({
			message: 'Reset OAuth settings to the recent saved settings',
			type: NotificationType.Info
		});
	}

	async function saveSetting() {
		try {
			const { data: currentConfig } = await api.systemConfigApi.getConfig();

			const result = await api.systemConfigApi.updateConfig({
				ffmpeg: currentConfig.ffmpeg,
				oauth: oauthConfig
			});

			oauthConfig = result.data.oauth;
			savedConfig = result.data.oauth;

			notificationController.show({
				message: 'OAuth settings saved',
				type: NotificationType.Info
			});
		} catch (e) {
			console.error('Error [oauth-settings] [saveSetting]', e);
			notificationController.show({
				message: 'Unable to save settings',
				type: NotificationType.Error
			});
		}
	}

	async function resetToDefault() {
		const { data: defaultConfig } = await api.systemConfigApi.getDefaults();

		oauthConfig = defaultConfig.oauth;

		notificationController.show({
			message: 'Reset OAuth settings to default',
			type: NotificationType.Info
		});
	}
</script>

<div class="mt-2">
	{#await getConfigs() then}
		<div in:fade={{ duration: 500 }}>
			<form autocomplete="off" on:submit|preventDefault>
				<div class="mt-4">
					<SettingSwitch title="Enable" bind:checked={oauthConfig.enabled} />
				</div>

				<hr class="m-4" />

				<SettingInputField
					inputType={SettingInputFieldType.TEXT}
					label="ISSUER URL"
					bind:value={oauthConfig.issuerUrl}
					required={true}
					disabled={!oauthConfig.enabled}
					isEdited={!(oauthConfig.issuerUrl == savedConfig.issuerUrl)}
				/>

				<SettingInputField
					inputType={SettingInputFieldType.TEXT}
					label="CLIENT ID"
					bind:value={oauthConfig.clientId}
					required={true}
					disabled={!oauthConfig.enabled}
					isEdited={!(oauthConfig.clientId == savedConfig.clientId)}
				/>

				<SettingInputField
					inputType={SettingInputFieldType.TEXT}
					label="CLIENT SECRET"
					bind:value={oauthConfig.clientSecret}
					required={true}
					disabled={!oauthConfig.enabled}
					isEdited={!(oauthConfig.clientSecret == savedConfig.clientSecret)}
				/>

				<SettingInputField
					inputType={SettingInputFieldType.TEXT}
					label="SCOPE"
					bind:value={oauthConfig.scope}
					required={true}
					disabled={!oauthConfig.enabled}
					isEdited={!(oauthConfig.scope == savedConfig.scope)}
				/>

				<SettingInputField
					inputType={SettingInputFieldType.TEXT}
					label="BUTTON TEXT"
					bind:value={oauthConfig.buttonText}
					required={false}
					disabled={!oauthConfig.enabled}
					isEdited={!(oauthConfig.buttonText == savedConfig.buttonText)}
				/>

				<div class="mt-4">
					<SettingSwitch
						title="AUTO REGISTER"
						subtitle="Automatically register new users after singning in with OAuth"
						bind:checked={oauthConfig.autoRegister}
						disabled={!oauthConfig.enabled}
					/>
				</div>

				<SettingButtonsRow
					on:reset={reset}
					on:save={saveSetting}
					on:reset-to-default={resetToDefault}
					showResetToDefault={!_.isEqual(savedConfig, defaultConfig)}
				/>
			</form>
		</div>
	{/await}
</div>
