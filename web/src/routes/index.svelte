<script context="module" lang="ts">
	export const prerender = false;
	import type { Load } from '@sveltejs/kit';
	import { api } from '@api';

	export const load: Load = async () => {
		try {
			const { data: user } = await api.userApi.getMyUserInfo();

			return {
				status: 302,
				redirect: '/photos'
			};
		} catch (e) {}

		const { data } = await api.userApi.getUserCount();

		return {
			status: 200,
			props: {
				isAdminUserExist: data.userCount == 0 ? false : true
			}
		};
	};
</script>

<script lang="ts">
	import { goto } from '$app/navigation';

	export let isAdminUserExist: boolean;

	async function onGettingStartedClicked() {
		isAdminUserExist ? goto('/auth/login') : goto('/auth/register');
	}
</script>

<svelte:head>
	<title>Welcome 🎉 - Immich</title>
	<meta name="description" content="Immich Web Interface" />
</svelte:head>

<section class="h-screen w-screen flex place-items-center place-content-center">
	<div class="flex flex-col place-items-center gap-8 text-center max-w-[350px]">
		<div class="flex place-items-center place-content-center ">
			<img class="text-center" src="immich-logo.svg" height="200" width="200" alt="immich-logo" />
		</div>
		<h1 class="text-4xl text-immich-primary font-bold font-immich-title">Welcome to IMMICH Web</h1>
		<button
			class="border px-4 py-2 rounded-md bg-immich-primary hover:bg-immich-primary/75 text-white font-bold w-[200px]"
			on:click={onGettingStartedClicked}>Getting Started</button
		>
	</div>
</section>
