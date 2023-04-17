<script lang="ts">
	import { AppRoute } from '$lib/constants';
	import Magnify from 'svelte-material-icons/Magnify.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import { goto } from '$app/navigation';
	import { savedSearchTerms } from '$lib/stores/search.store';
	import { fly } from 'svelte/transition';
	export let value = '';
	export let grayTheme: boolean;

	let showBigSearchBar = false;
	$: showClearIcon = value.length > 0;

	function onSearch(saveSearch: boolean) {
		let clipSearch = 'true';
		let searchValue = value;

		if (value.slice(0, 2) == 'm:') {
			clipSearch = 'false';
			searchValue = value.slice(2);
		}

		if (saveSearch) {
			saveSearchTerm(value);
		}

		const params = new URLSearchParams({
			q: searchValue,
			clip: clipSearch
		});

		goto(`${AppRoute.SEARCH}?${params}`);
	}

	const saveSearchTerm = (saveValue: string) => {
		$savedSearchTerms = [saveValue, ...$savedSearchTerms];

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
	on:submit|preventDefault={() => onSearch(true)}
	on:focusin={() => (showBigSearchBar = true)}
	on:focusout={() => (showBigSearchBar = false)}
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
			class="w-full transition-all  {grayTheme
				? 'dark:bg-immich-dark-gray'
				: 'dark:bg-immich-dark-bg'} text-immich-fg/75 dark:text-immich-dark-fg px-14 py-4 {showBigSearchBar
				? 'rounded-t-3xl bg-white  border border-gray-200 dark:border-gray-800'
				: 'rounded-3xl bg-gray-200 border border-transparent'}"
			placeholder="Search your photos"
			required
			pattern="^(?!m:$).*$"
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

	{#if showBigSearchBar}
		<div
			transition:fly={{ y: 25, duration: 250 }}
			class="w-full pb-5 absolute bg-white transition-all rounded-b-3xl shadow-2xl border border-gray-200 dark:bg-immich-dark-gray dark:border-gray-800 dark:text-gray-300"
		>
			<div class="px-5 pt-5 text-xs">
				<p>
					Smart search is enabled by default, to search for metadata use the syntax <span
						class="font-mono p-2 font-semibold text-immich-primary dark:text-immich-dark-primary bg-gray-100 rounded-lg dark:bg-gray-900"
						>m:your-search-term</span
					>
				</p>
			</div>

			{#if $savedSearchTerms.length > 0}
				<div class="px-5 pt-5 text-xs flex justify-between">
					<p>RECENT SEARCHES</p>
					<button
						type="button"
						class="text-immich-primary dark:text-immich-dark-primary font-semibold p-2 hover:bg-immich-primary/25 rounded-lg"
						on:click={clearSearchTerm}>Clear all</button
					>
				</div>
			{/if}

			{#each $savedSearchTerms as savedSearchTerm, i (i)}
				<button
					type="button"
					class="w-full hover:bg-gray-100 dark:hover:bg-gray-500/10 px-5 py-3 cursor-pointer flex gap-3 text-black dark:text-gray-300"
					on:click={() => {
						value = savedSearchTerm;
						onSearch(false);
					}}
				>
					<Magnify size="1.5em" />
					{savedSearchTerm}
				</button>
			{/each}
		</div>
	{/if}
</form>
