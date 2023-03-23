<script lang="ts">
	import { AppRoute } from '$lib/constants';
	import Magnify from 'svelte-material-icons/Magnify.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import { goto } from '$app/navigation';
	import { enableClip, savedSearchTerms } from '$lib/stores/search.store';
	import { clickOutside } from '$lib/utils/click-outside';
	import { fade, fly } from 'svelte/transition';
	export let value = '';
	export let grayTheme: boolean;

	// Replace state to immediately go back to previous page, instead
	// of having to go through every search query.
	export let replaceHistoryState = false;

	let showBigSearchBar = false;
	$: showClearIcon = value.length > 0;

	function onSearch() {
		saveSearchTerm();

		const params = new URLSearchParams({
			q: value,
			clip: 'true'
		});

		goto(`${AppRoute.SEARCH}?${params}`, { replaceState: replaceHistoryState });
	}

	const saveSearchTerm = () => {
		$savedSearchTerms = [value, ...$savedSearchTerms];

		if ($savedSearchTerms.length > 5) {
			$savedSearchTerms = $savedSearchTerms.slice(0, 5);
		}
	};

	const clearSearchTerm = () => {
		$savedSearchTerms = [];
	};
</script>

<form
	draggable="false"
	autocomplete="off"
	class="relative text-sm"
	action={AppRoute.SEARCH}
	on:reset={() => (value = '')}
	on:submit|preventDefault={onSearch}
	on:focusin={() => (showBigSearchBar = true)}
	use:clickOutside
	on:outclick={() => (showBigSearchBar = false)}
>
	<label>
		<div class="absolute inset-y-0 left-0 flex items-center pl-6">
			<div class="pointer-events-none dark:text-immich-dark-fg/75">
				<Magnify size="1.5em" />
			</div>
		</div>
		<input
			type="text"
			name="q"
			class="w-full transition-all bg-gray-200 {grayTheme
				? 'dark:bg-immich-dark-gray'
				: 'dark:bg-immich-dark-bg'} text-immich-fg/75 dark:text-immich-dark-fg px-14 py-4 {showBigSearchBar
				? 'rounded-t-3xl'
				: 'rounded-3xl'}"
			placeholder="Search"
			required
			bind:value
		/>
	</label>
	{#if showClearIcon}
		<div class="absolute inset-y-0 right-0 flex items-center pr-4">
			<button
				type="reset"
				class="dark:text-immich-dark-fg/75 hover:bg-immich-primary/5 dark:hover:bg-immich-dark-primary/25 rounded-full p-2 active:bg-immich-primary/10 dark:active:bg-immich-dark-primary/[.35]"
			>
				<Close size="1.5em" />
			</button>
		</div>
	{/if}

	<!-- {#if showBigSearchBar} -->
	<div
		transition:fly={{ y: 25, duration: 250 }}
		class="w-full pb-5 absolute bg-white transition-all rounded-b-3xl shadow-2xl border border-gray-200"
	>
		<div class="p-5 text-xs flex justify-between">
			<p>RECENT SEARCHES</p>
			<button type="button" class="text-immich-primary font-semibold" on:click={clearSearchTerm}
				>Clear all</button
			>
		</div>

		{#each $savedSearchTerms as savedSearchTerm, i (i)}
			<button
				type="button"
				class="w-full hover:bg-gray-100 px-5 py-3 cursor-pointer flex gap-3 text-black"
			>
				<Magnify size="1.5em" />
				{savedSearchTerm}
			</button>
		{/each}
	</div>
	<!-- {/if} -->
</form>
