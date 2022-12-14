<script lang="ts">
	import { api, SystemConfigStorageTemplateDto, UserResponseDto } from '@api';
	import * as luxon from 'luxon';
	import handlebar from 'handlebars';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { onMount } from 'svelte';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
	export let storageTemplate: SystemConfigStorageTemplateDto;
	export let user: UserResponseDto;

	const getSupportDateTimeFormat = async () => {
		const { data: templateOption } = await api.systemConfigApi.getStorageTemplateOptions();
		return templateOption;
	};

	let filenameTemplate = '';
	let directoryTemplate = '';

	onMount(() => {
		const filename = storageTemplate.template.split('/').pop();

		if (filename) {
			filenameTemplate = filename;
		}

		directoryTemplate = storageTemplate.template.replace(filenameTemplate, '');
	});

	$: parsedTemplate = () => {
		const template = handlebar.compile(storageTemplate.template);

		const compiledTemplate = template({
			filename: 'imagename',
			ext: 'jpeg',
			shortId: 'abcde12345'
		});

		const parsedTemplate = luxon.DateTime.fromISO(new Date().toISOString()).toFormat(
			compiledTemplate
		);

		return parsedTemplate;
	};

	const getLuxonExample = (format: string) => {
		return luxon.DateTime.fromISO(new Date().toISOString()).toFormat(format);
	};
</script>

{storageTemplate.template}
<section class="dark:text-immich-dark-fg">
	<div class="mt-4 text-sm">
		<h3 class="font-medium text-immich-primary dark:text-immich-dark-primary">Current template</h3>
		<pre class="text-black py-2 px-4 rounded-md mt-2 font-bold">{user.id}/{parsedTemplate()}</pre>
	</div>

	<div id="directory-path-builder" class="mt-4">
		<h3 class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm">
			Directory Path Builder
		</h3>

		<div>
			{#await getSupportDateTimeFormat()}
				<LoadingSpinner />
			{:then options}
				<div class="text-xs my-2">
					<h4>SUPPORTED DATE FORMAT</h4>
					<p class="italic">
						- The asset creation date will be used to extract the date time information below
					</p>
				</div>

				<div class="text-xs bg-gray-300 dark:text-immich-dark-bg p-4 mt-2 rounded-lg">
					<div class="flex justify-between">
						<div>
							<p class="text-immich-primary font-medium">YEAR</p>
							<ul>
								{#each options.yearOptions as yearFormat}
									<li>{yearFormat} - {getLuxonExample(yearFormat)}</li>
								{/each}
							</ul>
						</div>

						<div>
							<p class="text-immich-primary font-medium">MONTH</p>
							<ul>
								{#each options.monthOptions as monthFormat}
									<li>{monthFormat} - {getLuxonExample(monthFormat)}</li>
								{/each}
							</ul>
						</div>

						<div>
							<p class="text-immich-primary font-medium">DAY</p>
							<ul>
								{#each options.dayOptions as dayFormat}
									<li>{dayFormat} - {getLuxonExample(dayFormat)}</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			{/await}
		</div>
	</div>

	<div id="directory-path-builder" class="mt-4">
		<h3 class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm">
			Filename builder
		</h3>

		<form autocomplete="off" on:submit|preventDefault>
			<SettingInputField
				inputType={SettingInputFieldType.TEXT}
				label="FILENAME TEMPLATE"
				bind:value={filenameTemplate}
				required
			/>
		</form>
	</div>
</section>
