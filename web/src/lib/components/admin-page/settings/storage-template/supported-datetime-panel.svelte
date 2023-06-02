<script lang="ts">
	import type { SystemConfigTemplateStorageOptionDto } from '@api';
	import * as luxon from 'luxon';

	export let options: SystemConfigTemplateStorageOptionDto;

	const getLuxonExample = (format: string) => {
		return luxon.DateTime.fromISO(new Date('2022-09-04T20:03:05.250').toISOString()).toFormat(
			format
		);
	};
</script>

<div class="text-xs mt-2">
	<h4>DATE & TIME</h4>
</div>

<div class="text-xs bg-gray-200 dark:bg-gray-700 dark:text-immich-dark-fg p-4 mt-2 rounded-lg">
	<div class="mb-2 text-gray-600 dark:text-immich-dark-fg">
		<p>Asset's creation timestamp is used for the datetime information</p>
		<p>Sample time 2022-09-04T20:03:05.250</p>
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
