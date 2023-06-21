<script lang="ts">
	import SwapVertical from 'svelte-material-icons/SwapVertical.svelte';
	import Check from 'svelte-material-icons/Check.svelte';
	import LinkButton from './buttons/link-button.svelte';
	import { clickOutside } from '$lib/utils/click-outside';
	import { fly } from 'svelte/transition';

	export let options: string[] = [];
	export let value = options[0];

	let showMenu = false;

	const handleClickOutside = () => {
		showMenu = false;
	};

	const handleSelectOption = (index: number) => {
		value = options[index];
		showMenu = false;
	};
</script>

<div id="dropdown-button" use:clickOutside on:outclick={handleClickOutside}>
	<!-- BUTTON TITLE -->
	<LinkButton on:click={() => (showMenu = true)}>
		<div class="flex place-items-center gap-2 text-sm">
			<SwapVertical size="18" />
			{value}
		</div>
	</LinkButton>

	<!-- DROP DOWN MENU -->
	{#if showMenu}
		<div
			transition:fly={{ y: -30, x: 30, duration: 200 }}
			class="absolute top-5 right-0 min-w-[250px] bg-gray-100 dark:bg-gray-700 rounded-2xl py-4 shadow-lg dark:text-white text-black z-50 text-md flex flex-col"
		>
			{#each options as option, index (option)}
				<button
					class="hover:bg-gray-300 dark:hover:bg-gray-800 p-4 transition-all grid grid-cols-[20px,1fr] place-items-center gap-2"
					on:click={() => handleSelectOption(index)}
				>
					{#if value == option}
						<div class="text-immich-primary dark:text-immich-dark-primary font-medium">
							<Check size="18" />
						</div>
						<p
							class="justify-self-start text-immich-primary dark:text-immich-dark-primary font-medium"
						>
							{option}
						</p>
					{:else}
						<div />
						<p class="justify-self-start">
							{option}
						</p>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
