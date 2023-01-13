<script lang="ts" context="module">
	export type ImmichDropDownOption = {
		default: string;
		options: string[];
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	export let options: ImmichDropDownOption;
	export let selected: string;
	export let disabled = false;

	onMount(() => {
		selected = options.default;
	});

	export let isOpen = false;
	const toggle = () => (isOpen = !isOpen);
</script>

<div id="immich-dropdown" class="relative">
	<button
		{disabled}
		on:click={toggle}
		aria-expanded={isOpen}
		class="bg-gray-200 w-full flex p-2 rounded-lg dark:bg-gray-600 place-items-center justify-between disabled:cursor-not-allowed dark:disabled:bg-gray-300 disabled:bg-gray-600 "
	>
		<div>
			{selected}
		</div>

		<div>
			<svg
				style="tran"
				width="20"
				height="20"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</button>

	{#if isOpen}
		<div class="flex flex-col mt-2 absolute w-full">
			{#each options.options as option}
				<button
					on:click={() => {
						selected = option;
						isOpen = false;
					}}
					class="bg-gray-200 dark:bg-gray-500 dark:hover:bg-gray-700 w-full flex p-2 hover:bg-gray-300 transition-all "
				>
					{option}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	svg {
		transition: transform 0.2s ease-in;
	}

	[aria-expanded='true'] svg {
		transform: rotate(0.5turn);
	}
</style>
