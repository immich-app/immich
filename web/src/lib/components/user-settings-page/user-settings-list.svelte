<script lang="ts">
	import { UserResponseDto } from '@api';
	import SettingAccordion from '../admin-page/settings/setting-accordion.svelte';
	import SettingInputField, {
		SettingInputFieldType
	} from '../admin-page/settings/setting-input-field.svelte';

	export let user: UserResponseDto;
</script>

<SettingAccordion title="User profile" subtitle="Manage the user information">
	<SettingInputField
		inputType={SettingInputFieldType.TEXT}
		label="First name"
		bind:value={user.firstName}
		required={true}
	/>

	<SettingInputField
		inputType={SettingInputFieldType.TEXT}
		label="Last name"
		bind:value={user.lastName}
		required={true}
	/>
</SettingAccordion>
