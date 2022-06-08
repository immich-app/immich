<script>
	import { goto } from '$app/navigation';

	import NavigationBar from '$lib/components/shared/navigation-bar.svelte';
	import StatusBox from '$lib/components/shared/status-box.svelte';
</script>

<svelte:head>
	<title>Immich Changelog</title>
</svelte:head>

<div class="w-screen bg-gray-100 py-8">
	<div class="m-auto w-[900px]">
		<div class="inline-block ml-16 mb-4 text-xl  transition-all">
			<button
				on:click={() => goto('/')}
				class="flex place-items-center place-content-center gap-2 hover:bg-immich-primary/5 p-2 rounded-lg font-medium"
				>Home</button
			>
		</div>
		<div class="flex gap-10 place-items-center">
			<img src="/immich-logo-no-outline.png" alt="immich logo" height="200" width="200" />

			<div>
				<h1 class="font-immich-title text-[72px] text-immich-primary">IMMICH</h1>
				<h1 class="text-4xl">Changelog</h1>
			</div>
		</div>
	</div>
</div>
