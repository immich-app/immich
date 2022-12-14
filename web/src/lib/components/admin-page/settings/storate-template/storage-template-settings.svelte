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
			const dt = luxon.DateTime.fromISO(new Date().toISOString());

			return template(
				{
					y: dt.toFormat('y'),
					yy: dt.toFormat('yy'),
					L: dt.toFormat('L'),
					LL: dt.toFormat('LL'),
					LLL: dt.toFormat('LLL'),
					LLLL: dt.toFormat('LLLL'),
					d: dt.toFormat('d'),
					dd: dt.toFormat('dd'),
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
		return luxon.DateTime.fromISO(new Date().toISOString()).toFormat(format);
	};
</script>

<section class="dark:text-immich-dark-fg">
	<div class="mt-4 text-sm">
		<h3 class="font-medium text-immich-primary dark:text-immich-dark-primary">Preview</h3>
		<p class="text-xs">
			Approximately path length limit : <span
				class="font-semibold text-immich-primary dark:text-immich-dark-primary"
				>{parsedTemplate().length + user.id.length + 'UPLOAD_LOCATION'.length}</span
			>/260
		</p>
		<p class="text-xs"><span class="font-semibold">{user.id}</span> is the user ID</p>

		<p class="p-4 bg-gray-200 dark:text-immich-dark-bg  py-2 rounded-md mt-2">
			<span class="text-immich-fg/25">UPLOAD_LOCATION/{user.id}</span>/{parsedTemplate()}
		</p>
	</div>

	<div id="directory-path-builder" class="mt-4">
		<h3 class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm">
			Template builder
		</h3>

		<div class="support-date">
			{#await getSupportDateTimeFormat()}
				<LoadingSpinner />
			{:then options}
				<div class="text-xs my-2">
					<h4>SUPPORTED DATE TIME FORMAT</h4>
				</div>

				<div class="text-xs bg-gray-200 dark:text-immich-dark-bg p-4 mt-2 rounded-lg">
					<div class="flex gap-[50px]">
						<div>
							<p class="text-immich-primary font-medium">YEAR</p>
							<ul>
								{#each options.yearOptions as yearFormat}
									<li>{'{{'}{yearFormat}{'}}'} - {getLuxonExample(yearFormat)}</li>
								{/each}
							</ul>
						</div>

						<div>
							<p class="text-immich-primary font-medium">MONTH</p>
							<ul>
								{#each options.monthOptions as monthFormat}
									<li>{'{{'}{monthFormat}{'}}'} - {getLuxonExample(monthFormat)}</li>
								{/each}
							</ul>
						</div>

						<div>
							<p class="text-immich-primary font-medium">DAY</p>
							<ul>
								{#each options.dayOptions as dayFormat}
									<li>{'{{'}{dayFormat}{'}}'} - {getLuxonExample(dayFormat)}</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			{/await}
		</div>

		<div class="support-date">
			<div class="text-xs my-2">
				<h4>SUPPORTED VARIABLES</h4>
			</div>

			<div class="text-xs bg-gray-200 dark:text-immich-dark-bg p-4 mt-2 rounded-lg">
				<div class="flex gap-[50px]">
					<div>
						<p class="text-immich-primary font-medium">FILE NAME</p>
						<ul>
							<li>{`{{filename}}`}</li>
						</ul>
					</div>

					<div>
						<p class="text-immich-primary font-medium">FILE EXTENSION</p>
						<ul>
							<li>{`{{ext}}`}</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-2 flex flex-col">
			<label class="text-xs mb-2" for="path-tempalte">INPUT</label>

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
					name="path-template"
					id="path-template"
					value={'.{{ext}}'}
					disabled
					title="File extension is automatically added"
				/>
			</form>
		</div>
	</div>
</section>
