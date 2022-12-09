<script lang="ts">
	import { SystemConfigOAuthDto } from '@api';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
	import SettingSwitch from '../setting-switch.svelte';

	export let oauthConfig: SystemConfigOAuthDto;
</script>

<div class="mt-2">
	<form autocomplete="off">
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
				bind:checked={oauthConfig.autoRegister}
				disabled={!oauthConfig.enabled}
			/>
		</div>
	</form>
</div>
