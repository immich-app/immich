<script lang="ts">

	import { createEventDispatcher } from 'svelte';
	import { SystemConfigResponseDto } from "../../../../api";
	export let settings: SystemConfigResponseDto;

	const dispatch = createEventDispatcher();
</script>

<table class="text-left w-full my-4">
	<thead class="border rounded-md mb-4 bg-gray-50 flex text-immich-primary w-full h-12 dark:bg-immich-dark-gray dark:text-immich-dark-primary dark:border-immich-dark-gray">
	<tr class="flex w-full place-items-center">
		<th class="text-center w-1/2 font-medium text-sm">Setting</th>
		<th class="text-center w-1/2 font-medium text-sm">Value</th>
	</tr>
	</thead>
	<tbody class="rounded-md w-full max-h-[320px] block border dark:border-immich-dark-gray">
	{#each Object.entries(settings.config) as [name, value], i}
		<tr class={`text-center flex place-items-center w-full h-[80px] dark:text-immich-dark-fg ${
					i % 2 == 0 ? 'bg-slate-50 dark:bg-[#181818]' : 'bg-immich-bg dark:bg-immich-dark-bg'
				}`}>
			<td class="text-sm px-4 w-1/2 text-ellipsis">
				{name.split('_').map((word) => {return word.charAt(0).toUpperCase() + word.slice(1)}).join(' ')}
			</td>
			<td class="text-sm px-4 w-1/2 text-ellipsis">
				<input
					style="text-align: center"
					class="immich-form-input"
					id="{name}"
					name="{name}"
					type="text"
					value={value}
				/>
			</td>
		</tr>
	{/each}
	</tbody>
</table>
