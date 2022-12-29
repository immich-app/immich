<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { handleError } from '$lib/utils/handle-error';
	import { api, SystemConfigOAuthDto } from '@api';
	import _ from 'lodash';
	import { fade } from 'svelte/transition';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
	import SettingSwitch from '../setting-switch.svelte';

	export let oauthConfig: SystemConfigOAuthDto;

	let savedConfig: SystemConfigOAuthDto;
	let defaultConfig: SystemConfigOAuthDto;

	const handleToggleOverride = () => {
		// click runs before bind
		const previouslyEnabled = oauthConfig.mobileOverrideEnabled;
		if (!previouslyEnabled && !oauthConfig.mobileRedirectUri) {
			oauthConfig.mobileRedirectUri = window.location.origin + '/api/oauth/mobile-redirect';
		}
	};

	async function getConfigs() {
		[savedConfig, defaultConfig] = await Promise.all([
			api.systemConfigApi.getConfig().then((res) => res.data.oauth),
			api.systemConfigApi.getDefaults().then((res) => res.data.oauth)
		]);
	}

	async function reset() {
		const { data: resetConfig } = await api.systemConfigApi.getConfig();

		oauthConfig = { ...resetConfig.oauth };
		savedConfig = { ...resetConfig.oauth };

		notificationController.show({
			message: 'Reset OAuth settings to the last saved settings',
			type: NotificationType.Info
		});
	}

	async function saveSetting() {
		try {
			const { data: currentConfig } = await api.systemConfigApi.getConfig();

			if (!oauthConfig.mobileOverrideEnabled) {
				oauthConfig.mobileRedirectUri = '';
			}

			const result = await api.systemConfigApi.updateConfig({
				...currentConfig,
				oauth: oauthConfig
			});

			oauthConfig = { ...result.data.oauth };
			savedConfig = { ...result.data.oauth };

			notificationController.show({
				message: 'OAuth settings saved',
				type: NotificationType.Info
			});
		} catch (error) {
			handleError(error, 'Unable to save OAuth settings');
		}
	}

	async function resetToDefault() {
		const { data: defaultConfig } = await api.systemConfigApi.getDefaults();

		oauthConfig = { ...defaultConfig.oauth };

		notificationController.show({
			message: 'Reset OAuth settings to default',
			type: NotificationType.Info
		});
	}
</script>

<div class="mt-2">
	{#await getConfigs() then}
		<div in:fade={{ duration: 500 }}>
			<form autocomplete="off" on:submit|preventDefault class="flex flex-col mx-4 gap-4 py-4">
				<p class="text-sm dark:text-immich-dark-fg">
					For more details about this feature, refer to the <a
						href="http://immich.app/docs/features/oauth#mobile-redirect-uri"
						class="underline"
						target="_blank"
						rel="noreferrer">docs</a
					>.
				</p>

				<SettingSwitch title="Enable" bind:checked={oauthConfig.enabled} />
				<hr />
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

				<SettingSwitch
					title="AUTO REGISTER"
					subtitle="Automatically register new users after signing in with OAuth"
					bind:checked={oauthConfig.autoRegister}
					disabled={!oauthConfig.enabled}
				/>

				<SettingSwitch
					title="MOBILE REDIRECT URI OVERRIDE"
					subtitle="Enable when `app.immich:/` is an invalid redirect URI."
					disabled={!oauthConfig.enabled}
					on:click={() => handleToggleOverride()}
					bind:checked={oauthConfig.mobileOverrideEnabled}
				/>

				{#if oauthConfig.mobileOverrideEnabled}
					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="MOBILE REDIRECT URI"
						bind:value={oauthConfig.mobileRedirectUri}
						required={true}
						disabled={!oauthConfig.enabled}
						isEdited={!(oauthConfig.mobileRedirectUri == savedConfig.mobileRedirectUri)}
					/>
				{/if}

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
