<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import FullScreenModal from './full-screen-modal.svelte';
	export let localVersion: string;
	export let remoteVersion: string;

	const dispatch = createEventDispatcher();

	const acknowledgeClickHandler = () => {
		localStorage.setItem('appVersion', remoteVersion);

		dispatch('close');
	};
</script>

<div class="absolute top-0 left-0 w-screen h-screen">
	<FullScreenModal on:clickOutside={() => console.log('Click outside')}>
		<div class="max-w-[500px] max-w-[95vw] z-[99999] border bg-immich-bg p-10 rounded-xl">
			<p class="text-2xl ">🎉 NEW VERSION AVAILABLE 🎉</p>
			<br />

			<section class="max-h-[400px] overflow-y-auto">
				<div class="font-thin">
					Hi friend, there is a new release of <span
						class="font-immich-title text-immich-primary font-bold">IMMICH</span
					>, please take your time to visit the
					<span class="underline font-medium"
						><a
							href="https://github.com/immich-app/immich/releases/latest"
							target="_blank"
							rel="noopener noreferrer">release note</a
						></span
					>
					and ensure your <code>docker-compose</code>, and <code>.env</code> setup is up-to-date to prevent
					any misconfigurations, especially if you use WatchTower or any mechanism that handles updating
					your application automatically.
				</div>

				{#if remoteVersion == 'v1.11.0_17-dev'}
					<div class="mt-2 font-thin">
						This specific version <span class="font-medium">v1.11.0_17-dev</span> includes changes in
						the docker-compose setup that added additional containters. Please make sure to update the
						docker-compose file, pull new images and check your setup for the latest features and bug
						fixes.
					</div>
				{/if}
			</section>

			<div class="font-thin mt-4">Your friend, Alex</div>
			<div class="text-xs mt-8">
				<code>Local Version {localVersion}</code>
				<br />
				<code>Remote Version {remoteVersion}</code>
			</div>

			<div class="text-right mt-4">
				<button
					class="bg-immich-primary text-gray-50 hover:bg-immich-primary/90 py-2 px-4 rounded-lg font-medium shadow-lg transition-all"
					on:click={acknowledgeClickHandler}>Acknowledge</button
				>
			</div>
		</div>
	</FullScreenModal>
</div>
