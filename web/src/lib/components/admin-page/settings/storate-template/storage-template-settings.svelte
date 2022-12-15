<script lang="ts">
	import { api, SystemConfigStorageTemplateDto, UserResponseDto } from '@api';
	import * as luxon from 'luxon';
	import handlebar from 'handlebars';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	export let storageTemplate: SystemConfigStorageTemplateDto;
	export let user: UserResponseDto;

	const getSupportDateTimeFormat = async () => {
		const { data: templateOption } = await api.systemConfigApi.getStorageTemplateOptions();
		return templateOption;
	};

	let editableTemplate = storageTemplate.template.split('.')[0];
	$: parsedTemplate = () => {
		try {
			const templateString = editableTemplate + '.{{ext}}';
			const template = handlebar.compile(templateString, {
				knownHelpers: undefined
			});
			const dt = luxon.DateTime.fromISO(new Date('2020-09-04T21:03:05.250').toISOString());

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

	const getLuxonExample = (format: string) => {
		return luxon.DateTime.fromISO(new Date('2020-09-04T21:03:05.250').toISOString()).toFormat(
			format
		);
	};
</script>

<section class="dark:text-immich-dark-fg">
	<div class="my-4">
		<h3 class="text-base font-medium text-immich-primary dark:text-immich-dark-primary">Preview</h3>
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

	<div id="directory-path-builder" class="mt-4">
		<h3 class="font-medium text-immich-primary dark:text-immich-dark-primary text-base">
			Template builder
		</h3>

		<div class="support-date">
			{#await getSupportDateTimeFormat()}
				<LoadingSpinner />
			{:then options}
				<div class="text-xs mt-2">
					<h4>SUPPORTED DATE TIME FORMAT</h4>
				</div>

				<div
					class="text-xs bg-gray-200 dark:bg-gray-700 dark:text-immich-dark-fg p-4 mt-2 rounded-lg"
				>
					<div class="mb-2 text-gray-600 dark:text-immich-dark-fg">
						<p>Asset's creation timestamp is used for the datetime information</p>
						<p>Sample time 2020-09-04T21:03:05.250</p>
					</div>
					<div class="flex gap-[50px]">
						<div>
							<p class="text-immich-primary font-medium dark:text-immich-dark-primary">YEAR</p>
							<ul>
								{#each options.yearOptions as yearFormat}
									<li>{'{{'}{yearFormat}{'}}'} - {getLuxonExample(yearFormat)}</li>
								{/each}
							</ul>
						</div>

						<div>
							<p class="text-immich-primary font-medium dark:text-immich-dark-primary">MONTH</p>
							<ul>
								{#each options.monthOptions as monthFormat}
									<li>{'{{'}{monthFormat}{'}}'} - {getLuxonExample(monthFormat)}</li>
								{/each}
							</ul>
						</div>

						<div>
							<p class="text-immich-primary font-medium dark:text-immich-dark-primary">DAY</p>
							<ul>
								{#each options.dayOptions as dayFormat}
									<li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
								{/each}
							</ul>
						</div>

						<div>
							<p class="text-immich-primary font-medium dark:text-immich-dark-primary">HOUR</p>
							<ul>
								{#each options.hourOptions as dayFormat}
									<li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
								{/each}
							</ul>
						</div>

						<div>
							<p class="text-immich-primary font-medium dark:text-immich-dark-primary">MINUTE</p>
							<ul>
								{#each options.minuteOptions as dayFormat}
									<li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
								{/each}
							</ul>
						</div>

						<div>
							<p class="text-immich-primary font-medium dark:text-immich-dark-primary">SECOND</p>
							<ul>
								{#each options.secondOptions as dayFormat}
									<li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			{/await}
		</div>

		<div class="support-date">
			<div class="text-xs mt-4">
				<h4>SUPPORTED VARIABLES</h4>
			</div>

			<div
				class="text-xs bg-gray-200 dark:bg-gray-700 dark:text-immich-dark-fg p-4 mt-2 rounded-lg"
			>
				<div class="flex gap-[50px]">
					<div>
						<p class="text-immich-primary font-medium dark:text-immich-dark-primary">FILE NAME</p>
						<ul>
							<li>{`{{filename}}`}</li>
						</ul>
					</div>

					<div>
						<p class="text-immich-primary font-medium dark:text-immich-dark-primary">
							FILE EXTENSION
						</p>
						<ul>
							<li>{`{{ext}}`}</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-4 flex flex-col">
			<label class="text-xs mb-2" for="path-template">INPUT</label>

			<form autocomplete="off" class="flex gap-2">
				<input
					class="immich-form-input w-full"
					type="text"
					name="path-template"
					id="path-template"
					bind:value={editableTemplate}
				/>

				<input
					class="immich-form-input"
					type="text"
					name="filename-extention"
					id="filename-extention"
					value={'.{{ext}}'}
					disabled
					title="File extension is automatically added"
				/>
			</form>
		</div>
	</div>
</section>
