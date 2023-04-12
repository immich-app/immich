<script lang="ts">
	import { getGithubVersion } from '$lib/utils/get-github-version';
	import { onMount } from 'svelte';
	import FullScreenModal from './full-screen-modal.svelte';
	import type { ServerVersionReponseDto } from '@api';
	import Button from '../elements/buttons/button.svelte';

	export let serverVersion: ServerVersionReponseDto;

	let showModal = false;
	let githubVersion: string;
	$: serverVersionName = semverToName(serverVersion);

	function semverToName({ major, minor, patch }: ServerVersionReponseDto) {
		return `v${major}.${minor}.${patch}`;
	}

	function onAcknowledge() {
		// Store server version to prevent the notification
		// from showing again.
		localStorage.setItem('appVersion', githubVersion);
		showModal = false;
	}

	onMount(async () => {
		try {
			githubVersion = await getGithubVersion();
			if (localStorage.getItem('appVersion') === githubVersion) {
				// Updated version has already been acknowledged.
				return;
			}

			if (githubVersion !== serverVersionName) {
				showModal = true;
			}
		} catch (err) {
			// Only log any errors that occur.
			console.error('Error [VersionAnnouncementBox]:', err);
		}
	});
</script>

{#if showModal}
	<FullScreenModal on:clickOutside={() => (showModal = false)}>
		<div
			class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray shadow-sm max-w-lg rounded-3xl py-10 px-8 dark:text-immich-dark-fg "
		>
			<p class="text-2xl mb-4">🎉 NEW VERSION AVAILABLE 🎉</p>

			<div>
				Hi friend, there is a new release of
				<span class="font-immich-title text-immich-primary dark:text-immich-dark-primary font-bold"
					>IMMICH</span
				>, please take your time to visit the
				<span class="underline font-medium"
					><a
						href="https://github.com/immich-app/immich/releases/latest"
						target="_blank"
						rel="noopener noreferrer">release notes</a
					></span
				>
				and ensure your <code>docker-compose</code>, and <code>.env</code> setup is up-to-date to prevent
				any misconfigurations, especially if you use WatchTower or any mechanism that handles updating
				your application automatically.
			</div>

			<div class="font-medium mt-4">Your friend, Alex</div>

			<div class="font-sm mt-8">
				<code>Server Version: {serverVersionName}</code>
				<br />
				<code>Latest Version: {githubVersion}</code>
			</div>

			<div class="text-right mt-8">
				<Button fullwidth on:click={onAcknowledge}>Acknowledge</Button>
			</div>
		</div>
	</FullScreenModal>
{/if}
