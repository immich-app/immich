<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, SystemConfigOAuthDto } from '@api';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
	import SettingSwitch from '../setting-switch.svelte';

	export let oauthConfig: SystemConfigOAuthDto;

	async function resetToDefault() {
		const { data: defaultConfig } = await api.systemConfigApi.getConfig();

		oauthConfig = defaultConfig.oauth;
	}

	async function saveSetting() {
		try {
			const { data: currentConfig } = await api.systemConfigApi.getConfig();

			const result = await api.systemConfigApi.updateConfig({
				ffmpeg: currentConfig.ffmpeg,
				oauth: oauthConfig
			});

			oauthConfig = result.data.oauth;

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
</script>

<div class="mt-2">
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
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="CLIENT ID"
			bind:value={oauthConfig.clientId}
			required={true}
			disabled={!oauthConfig.enabled}
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="CLIENT SECRET"
			bind:value={oauthConfig.clientSecret}
			required={true}
			disabled={!oauthConfig.enabled}
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="SCOPE"
			bind:value={oauthConfig.scope}
			required={true}
			disabled={!oauthConfig.enabled}
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="BUTTON TEXT"
			bind:value={oauthConfig.buttonText}
			required={false}
			disabled={!oauthConfig.enabled}
		/>

		<div class="mt-4">
			<SettingSwitch
				title="AUTO REGISTER"
				subtitle="Automatically register new users after singning in with OAuth"
				bind:checked={oauthConfig.autoRegister}
				disabled={!oauthConfig.enabled}
			/>
		</div>

		<SettingButtonsRow on:reset={resetToDefault} on:save={saveSetting} />
	</form>
</div>
