<script lang="ts">
	import {
		api,
		SystemConfigStorageTemplateDto,
		SystemConfigTemplateStorageOptionDto,
		UserResponseDto
	} from '@api';
	import * as luxon from 'luxon';
	import handlebar from 'handlebars';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { fade } from 'svelte/transition';
	import SupportedDatetimePanel from './supported-datetime-panel.svelte';
	import SupportedVariablesPanel from './supported-variables-panel.svelte';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import { isEqual } from 'lodash-es';
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';

	export let storageConfig: SystemConfigStorageTemplateDto;
	export let user: UserResponseDto;

	let savedConfig: SystemConfigStorageTemplateDto;
	let defaultConfig: SystemConfigStorageTemplateDto;
	let templateOptions: SystemConfigTemplateStorageOptionDto;
	let selectedPreset = '';

	async function getConfigs() {
		[savedConfig, defaultConfig, templateOptions] = await Promise.all([
			api.systemConfigApi.getConfig().then((res) => res.data.storageTemplate),
			api.systemConfigApi.getDefaults().then((res) => res.data.storageTemplate),
			api.systemConfigApi.getStorageTemplateOptions().then((res) => res.data)
		]);

		selectedPreset = savedConfig.template;
	}

	const getSupportDateTimeFormat = async () => {
		const { data } = await api.systemConfigApi.getStorageTemplateOptions();
		return data;
	};

	$: parsedTemplate = () => {
		try {
			return renderTemplate(storageConfig.template);
		} catch (error) {
			return 'error';
		}
	};

	const renderTemplate = (templateString: string) => {
		const template = handlebar.compile(templateString, {
			knownHelpers: undefined
		});

		const substitutions: Record<string, string> = {
			filename: 'IMAGE_56437',
			ext: 'jpg',
			filetype: 'IMG',
			filetypefull: 'IMAGE'
		};

		const dt = luxon.DateTime.fromISO(new Date('2022-09-04T20:03:05.250').toISOString());

		const dateTokens = [
			...templateOptions.yearOptions,
			...templateOptions.monthOptions,
			...templateOptions.dayOptions,
			...templateOptions.hourOptions,
			...templateOptions.minuteOptions,
			...templateOptions.secondOptions
		];

		for (const token of dateTokens) {
			substitutions[token] = dt.toFormat(token);
		}

		return template(substitutions);
	};

	async function reset() {
		const { data: resetConfig } = await api.systemConfigApi.getConfig();

		storageConfig.template = resetConfig.storageTemplate.template;
		savedConfig.template = resetConfig.storageTemplate.template;

		notificationController.show({
			message: 'Reset storage template settings to the recent saved settings',
			type: NotificationType.Info
		});
	}

	async function saveSetting() {
		try {
			const { data: currentConfig } = await api.systemConfigApi.getConfig();

			const result = await api.systemConfigApi.updateConfig({
				systemConfigDto: {
					...currentConfig,
					storageTemplate: storageConfig
				}
			});

			storageConfig.template = result.data.storageTemplate.template;
			savedConfig.template = result.data.storageTemplate.template;

			notificationController.show({
				message: 'Storage template saved',
				type: NotificationType.Info
			});
		} catch (e) {
			console.error('Error [storage-template-settings] [saveSetting]', e);
			notificationController.show({
				message: 'Unable to save settings',
				type: NotificationType.Error
			});
		}
	}

	async function resetToDefault() {
		const { data: defaultConfig } = await api.systemConfigApi.getDefaults();

		storageConfig.template = defaultConfig.storageTemplate.template;

		notificationController.show({
			message: 'Reset storage template to default',
			type: NotificationType.Info
		});
	}

	const handlePresetSelection = () => {
		storageConfig.template = selectedPreset;
	};
</script>

<section class="dark:text-immich-dark-fg">
	{#await getConfigs() then}
		<div id="directory-path-builder" class="m-4">
			<h3 class="font-medium text-immich-primary dark:text-immich-dark-primary text-base">
				Variables
			</h3>

			<section class="support-date">
				{#await getSupportDateTimeFormat()}
					<LoadingSpinner />
				{:then options}
					<div transition:fade={{ duration: 200 }}>
						<SupportedDatetimePanel {options} />
					</div>
				{/await}
			</section>

			<section class="support-date">
				<SupportedVariablesPanel />
			</section>

			<div class="mt-4 flex flex-col">
				<h3 class="font-medium text-immich-primary dark:text-immich-dark-primary text-base">
					Template
				</h3>

				<div class="text-xs my-2">
					<h4>PREVIEW</h4>
				</div>

				<p class="text-xs">
					Approximately path length limit : <span
						class="font-semibold text-immich-primary dark:text-immich-dark-primary"
						>{parsedTemplate().length + user.id.length + 'UPLOAD_LOCATION'.length}</span
					>/260
				</p>

				<p class="text-xs">
					<code>{user.storageLabel || user.id}</code> is the user's Storage Label
				</p>

				<p
					class="text-xs p-4 bg-gray-200 dark:bg-gray-700 dark:text-immich-dark-fg py-2 rounded-lg mt-2"
				>
					<span class="text-immich-fg/25 dark:text-immich-dark-fg/50"
						>UPLOAD_LOCATION/{user.storageLabel || user.id}</span
					>/{parsedTemplate()}.jpg
				</p>

				<form autocomplete="off" class="flex flex-col" on:submit|preventDefault>
					<div class="flex flex-col my-2">
						<label class="text-xs" for="presets">PRESET</label>
						<select
							class="text-sm bg-slate-200 p-2 rounded-lg mt-2 dark:bg-gray-600 hover:cursor-pointer"
							name="presets"
							id="preset-select"
							bind:value={selectedPreset}
							on:change={handlePresetSelection}
						>
							{#each templateOptions.presetOptions as preset}
								<option value={preset}>{renderTemplate(preset)}</option>
							{/each}
						</select>
					</div>
					<div class="flex gap-2 align-bottom">
						<SettingInputField
							label="TEMPLATE"
							required
							inputType={SettingInputFieldType.TEXT}
							bind:value={storageConfig.template}
							isEdited={!(storageConfig.template === savedConfig.template)}
						/>

						<div class="flex-0">
							<SettingInputField
								label="EXTENSION"
								inputType={SettingInputFieldType.TEXT}
								value={'.jpg'}
								disabled
							/>
						</div>
					</div>

					<div id="migration-info" class="text-sm mt-4">
						<p>
							Template changes will only apply to new assets. To retroactively apply the template to
							previously uploaded assets, run the <a
								href="/admin/jobs-status"
								class="text-immich-primary dark:text-immich-dark-primary">Storage Migration Job</a
							>
						</p>
					</div>

					<SettingButtonsRow
						on:reset={reset}
						on:save={saveSetting}
						on:reset-to-default={resetToDefault}
						showResetToDefault={!isEqual(savedConfig, defaultConfig)}
					/>
				</form>
			</div>
		</div>
	{/await}
</section>
