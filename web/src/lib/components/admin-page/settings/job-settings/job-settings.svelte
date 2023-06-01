<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, JobName, SystemConfigJobDto } from '@api';
	import { isEqual } from 'lodash-es';
	import { fade } from 'svelte/transition';
	import { handleError } from '../../../../utils/handle-error';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';

	export let jobConfig: SystemConfigJobDto; // this is the config that is being edited

	let savedConfig: SystemConfigJobDto;
	let defaultConfig: SystemConfigJobDto;

	const ignoredJobs = [JobName.BackgroundTask, JobName.Search] as JobName[];
	const jobNames = Object.values(JobName).filter(
		(jobName) => !ignoredJobs.includes(jobName as JobName)
	);

	async function getConfigs() {
		[savedConfig, defaultConfig] = await Promise.all([
			api.systemConfigApi.getConfig().then((res) => res.data.job),
			api.systemConfigApi.getDefaults().then((res) => res.data.job)
		]);
	}

	async function saveSetting() {
		try {
			const { data: configs } = await api.systemConfigApi.getConfig();

			const result = await api.systemConfigApi.updateConfig({
				systemConfigDto: {
					...configs,
					job: jobConfig
				}
			});

			jobConfig = { ...result.data.job };
			savedConfig = { ...result.data.job };

			notificationController.show({ message: 'Job settings saved', type: NotificationType.Info });
		} catch (error) {
			handleError(error, 'Unable to save settings');
		}
	}

	async function reset() {
		const { data: resetConfig } = await api.systemConfigApi.getConfig();

		jobConfig = { ...resetConfig.job };
		savedConfig = { ...resetConfig.job };

		notificationController.show({
			message: 'Reset Job settings to the recent saved settings',
			type: NotificationType.Info
		});
	}

	async function resetToDefault() {
		const { data: configs } = await api.systemConfigApi.getDefaults();

		jobConfig = { ...configs.job };
		defaultConfig = { ...configs.job };

		notificationController.show({
			message: 'Reset Job settings to default',
			type: NotificationType.Info
		});
	}
</script>

<div>
	{#await getConfigs() then}
		<div in:fade={{ duration: 500 }}>
			<form autocomplete="off" on:submit|preventDefault>
				{#each jobNames as jobName}
					<div class="flex flex-col gap-4 ml-4 mt-4">
						<SettingInputField
							inputType={SettingInputFieldType.NUMBER}
							label="{api.getJobName(jobName)} Concurrency"
							desc=""
							bind:value={jobConfig[jobName].concurrency}
							required={true}
							isEdited={!(jobConfig[jobName].concurrency == savedConfig[jobName].concurrency)}
						/>
					</div>
				{/each}

				<div class="ml-4">
					<SettingButtonsRow
						on:reset={reset}
						on:save={saveSetting}
						on:reset-to-default={resetToDefault}
						showResetToDefault={!isEqual(savedConfig, defaultConfig)}
					/>
				</div>
			</form>
		</div>
	{/await}
</div>
