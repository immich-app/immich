<script lang="ts">
	import {AdminConfigResponseDto} from '@api';

	import { createEventDispatcher } from 'svelte';
	import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
	import SaveOutline from 'svelte-material-icons/ContentSaveOutline.svelte';
	export let settings: AdminConfigResponseDto;

	const dispatch = createEventDispatcher();
	const edit: boolean[] = []
</script>

<table class="text-left w-full my-4">
	<thead class="border rounded-md mb-2 bg-gray-50 flex text-immich-primary w-full h-12 ">
	<tr class="flex w-full place-items-center">
		<th class="text-center w-2/5 font-medium text-sm">Setting</th>
		<th class="text-center w-2/5 font-medium text-sm">Value</th>
		<th class="text-center w-1/5 font-medium text-sm">Edit</th>
	</tr>
	</thead>
	<tbody class="rounded-md w-full max-h-[320px] block border">
	{#each Object.entries(settings.config) as [name, value], i}
		<tr class={`text-center flex place-items-center w-full border-b h-[80px] ${
					i % 2 == 0 ? 'bg-gray-100' : 'bg-immich-bg'
				}`}>
			<td class="text-sm px-4 w-2/5 text-ellipsis">
				{name.split('_').map((word) => {return word.charAt(0).toUpperCase() + word.slice(1)}).join(' ')}
			</td>
			<td class="text-sm px-4 w-2/5 text-ellipsis">
				<input
					style="text-align: center;"
					class="immich-form-input-dark"
					id="{name}"
					name="{name}"
					type="text"
					value={value}
					disabled="{!edit[name]}"
				/>
			</td>
			<td class="text-sm px-4 w-1/5 text-ellipsis">
				<button
					on:click={() => {{edit[name] = !edit[name]}}}
					class="bg-immich-primary text-gray-100 rounded-full p-3 transition-all duration-150 hover:bg-immich-primary/75">
					{#if edit[name]}
						<SaveOutline size="20" />
					{:else}
						<PencilOutline size="20" />
					{/if}
				</button>
			</td>
		</tr>
	{/each}
	</tbody>
</table>
