<script context="module" lang="ts">
	export const prerender = true;

	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ fetch }) => {
		const res = await fetch(`${serverEndpoint}/changelog`);
		const changelog = (await res.json()) as Changelog;
		return {
			status: 200,
			props: {
				changelog,
			},
		};
	};
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { serverEndpoint } from '../../lib/constants';
	import type { Changelog } from '../../lib/models/changelog';

	export let changelog: Changelog;
</script>

<svelte:head>
	<title>Immich Changelog</title>
</svelte:head>

<div class="w-screen py-8 relative bg-immich-primary/10">
	<div class="m-auto w-[900px]">
		<div class="flex gap-10 place-items-center">
			<img src="/immich-logo-no-outline.png" alt="immich logo" height="200" width="200" />

			<div>
				<h1 class="font-immich-title text-[72px] text-immich-primary">IMMICH</h1>
				<h1 class="text-4xl">Changelog</h1>
			</div>
		</div>
	</div>
</div>

<div class="m-auto w-[900px]">
	<div class="inline-block my-4 text-xl  transition-all">
		<button on:click={() => goto('/')} class="transition-all hover:text-immich-primary text-2xl "> Home</button>
	</div>
	<hr />
	<div class="mt-4">
		<p class="font-medium text-xl text-immich-primary">Version {changelog.latest.version}</p>
		<p>{changelog.latest.date}</p>

		{#if changelog.latest.content.breaking}
			<h1>Breaking</h1>

			{#each changelog.latest.content.breaking as breakingContent}
				<li>{breakingContent}</li>
			{/each}
		{/if}
	</div>

	{#each changelog.older as olderChangelog}
		<div class="mt-4">
			<p class="font-medium text-xl text-immich-primary">Version {olderChangelog.version}</p>
			<p>{olderChangelog.date}</p>

			{#if olderChangelog.content.breaking}
				<h1>Breaking</h1>

				{#each olderChangelog.content.breaking as breakingContent}
					<li>{breakingContent}</li>
				{/each}
			{/if}

			{#if olderChangelog.content.features}
				<h1>Features</h1>

				{#each olderChangelog.content.features as featureContent}
					<li>{featureContent}</li>
				{/each}
			{/if}
		</div>
	{/each}
</div>
