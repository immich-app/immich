<script lang="ts" context="module">
	export interface AccentColorSettings {
		accentColor?: string;
		darkAccentColor?: string;
		userAccentColor?: string;
		userDarkAccentColor?: string;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { UserResponseDto } from '@api';
	import { accentColors } from '$lib/stores/preferences.store';
	import { api, SystemConfigDisplayDto } from '@api';

	export let user: UserResponseDto;

	onMount(async () => {
		const { data } = await api.systemConfigApi.getConfig();
		const displayConfig: SystemConfigDisplayDto = data.display;

		$accentColors = {
			accentColor: displayConfig.accentColor ? displayConfig.accentColor : undefined,
			darkAccentColor: displayConfig.darkAccentColor ? displayConfig.darkAccentColor : undefined,
			userAccentColor: user.accentColor ? user.accentColor : undefined,
			userDarkAccentColor: user.darkAccentColor ? user.darkAccentColor : undefined
		};
	});
</script>
