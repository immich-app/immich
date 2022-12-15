<script lang="ts">
	import { api, SystemConfigStorageTemplateDto, UserResponseDto } from '@api';
	import * as luxon from 'luxon';
	import handlebar from 'handlebars';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { fade } from 'svelte/transition';
	import SupportedDatetimePanel from './supported-datetime-panel.svelte';
	import SupportedVariablesPanel from './supported-variables-panel.svelte';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import _ from 'lodash';
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';

	export let storageConfig: SystemConfigStorageTemplateDto;
	export let user: UserResponseDto;

	let savedConfig: SystemConfigStorageTemplateDto;
	let defaultConfig: SystemConfigStorageTemplateDto;

	async function getConfigs() {
		[savedConfig, defaultConfig] = await Promise.all([
			api.systemConfigApi.getConfig().then((res) => res.data.storageTemplate),
			api.systemConfigApi.getDefaults().then((res) => res.data.storageTemplate)
		]);
	}

	const getSupportDateTimeFormat = async () => {
		const { data: templateOption } = await api.systemConfigApi.getStorageTemplateOptions();
		return templateOption;
	};

	let editableTemplate = storageConfig.template.split('.')[0];

	$: parsedTemplate = () => {
		try {
			const templateString = editableTemplate + '.{{ext}}';
			const template = handlebar.compile(templateString, {
				knownHelpers: undefined
			});
			const dt = luxon.DateTime.fromISO(new Date('2022-09-04T21:03:05.250').toISOString());

			return template(
				{
					y: dt.toFormat('y'),
					yy: dt.toFormat('yy'),
					M: dt.toFormat('M'),
					MM: dt.toFormat('MM'),
					MMM: dt.toFormat('MMM'),
					MMMM: dt.toFormat('MMMM'),
					d: dt.toFormat('d'),
					dd: dt.toFormat('dd'),
					h: dt.toFormat('h'),
					hh: dt.toFormat('hh'),
					H: dt.toFormat('H'),
					HH: dt.toFormat('HH'),
					m: dt.toFormat('m'),
					mm: dt.toFormat('mm'),
					s: dt.toFormat('s'),
					ss: dt.toFormat('ss'),
					filename: 'IMG_10041123',
					ext: 'jpeg'
				},
				{}
			);
		} catch (error) {
			return 'error';
		}
	};

	const updateEditableTemplate = () => {
		editableTemplate = storageConfig.template.split('.')[0];
	};

	async function reset() {
		const { data: resetConfig } = await api.systemConfigApi.getConfig();

		storageConfig = resetConfig.storageTemplate;
		savedConfig = resetConfig.storageTemplate;
		updateEditableTemplate();

		notificationController.show({
			message: 'Reset storage template settings to the recent saved settings',
			type: NotificationType.Info
		});
	}

	async function saveSetting() {
		try {
			const { data: currentConfig } = await api.systemConfigApi.getConfig();

			const templateString = editableTemplate + '.{{ext}}';
			currentConfig.storageTemplate.template = templateString;

			const result = await api.systemConfigApi.updateConfig({
				...currentConfig
			});

			storageConfig = result.data.storageTemplate;
			savedConfig = result.data.storageTemplate;
			updateEditableTemplate();

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

		storageConfig = defaultConfig.storageTemplate;
		updateEditableTemplate();

		notificationController.show({
			message: 'Reset storage template to default',
			type: NotificationType.Info
		});
	}
</script>

<section class="dark:text-immich-dark-fg">
	{#await getConfigs() then}
		<div class="m-4">
			<h3 class="text-base font-medium text-immich-primary dark:text-immich-dark-primary">
				Preview
			</h3>
			<p class="text-sm">
				Approximately path length limit : <span
					class="font-semibold text-immich-primary dark:text-immich-dark-primary"
					>{parsedTemplate().length + user.id.length + 'UPLOAD_LOCATION'.length}</span
				>/260
			</p>

			<p
				class="text-xs p-4 bg-gray-200 dark:bg-gray-700 dark:text-immich-dark-fg py-2 rounded-md mt-2"
			>
				<span class="text-immich-fg/25 dark:text-immich-dark-fg/50">UPLOAD_LOCATION/{user.id}</span
				>/{parsedTemplate()}
			</p>
		</div>

		<div id="directory-path-builder" class="m-4">
			<h3 class="font-medium text-immich-primary dark:text-immich-dark-primary text-base">
				Template builder
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
				<label class="text-xs mb-2" for="path-template">INPUT</label>

				<form autocomplete="off" class="flex gap-2">
					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="Template"
						bind:value={editableTemplate}
						required
						isEdited={!(editableTemplate + '.{{ext}}' == savedConfig.template)}
					/>

					<div class="flex-0">
						<SettingInputField
							label="Extension"
							inputType={SettingInputFieldType.TEXT}
							value={'.{{ext}}'}
							disabled
						/>
					</div>
				</form>

				<SettingButtonsRow
					on:reset={reset}
					on:save={saveSetting}
					on:reset-to-default={resetToDefault}
					showResetToDefault={!_.isEqual(savedConfig, defaultConfig)}
				/>
			</div>
		</div>
	{/await}
</section>
