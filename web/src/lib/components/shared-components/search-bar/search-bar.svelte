<script lang="ts">
	import { AppRoute } from '$lib/constants';
	import Magnify from 'svelte-material-icons/Magnify.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import { goto } from '$app/navigation';

	export let value = '';
	export let grayTheme: boolean;

	// Replace state to immediately go back to previous page, instead
	// of having to go through every search query.
	export let replaceHistoryState = false;

	$: showClearIcon = value.length > 0;

	function onSearch() {
		const params = new URLSearchParams({
			q: value,
			clip: 'true'
		});

		goto(`${AppRoute.SEARCH}?${params}`, { replaceState: replaceHistoryState });
	}
</script>

<form
	autocomplete="off"
	class="relative text-sm"
	action={AppRoute.SEARCH}
	on:reset={() => (value = '')}
	on:submit|preventDefault={onSearch}
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
			class="w-full rounded-3xl bg-gray-200 {grayTheme
				? 'dark:bg-immich-dark-gray'
				: 'dark:bg-immich-dark-bg'} text-immich-fg/75 dark:text-immich-dark-fg px-14 py-4"
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
</form>
