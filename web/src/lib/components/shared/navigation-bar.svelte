<script lang="ts">
	import { page } from '$app/stores';
	import type { ImmichUser } from '$lib/models/immich-user';
	import { fade } from 'svelte/transition';

	export let user: ImmichUser;

	let shouldShowAccountInfo = false;

	const getFirstLetter = (text?: string) => {
		return text?.charAt(0).toUpperCase();
	};
</script>

<section id="dashboard-navbar" class="fixed w-screen  z-[100] bg-immich-bg text-sm">
	<div class="flex border place-items-center px-6 py-2 ">
		<a class="flex gap-2 place-items-center hover:cursor-pointer" href="/photos">
			<img src="/immich-logo.svg" alt="immich logo" height="35" width="35" />
			<h1 class="font-immich-title text-2xl text-immich-primary">IMMICH</h1>
		</a>
		<div class="flex-1 ml-24">
			<input class="w-[50%] border rounded-md bg-gray-200 px-8 py-4" placeholder="Search - Coming soon" />
		</div>
		<section class="flex gap-6 place-items-center">
			<!-- <div>Upload</div> -->

			{#if user.isAdmin}
				<a
					class={`hover:text-immich-primary font-medium ${
						$page.url.pathname == '/admin' && 'text-immich-primary underline'
					}`}
					href="/admin">Administration</a
				>
			{/if}

			<div
				on:mouseover={() => (shouldShowAccountInfo = true)}
				on:focus={() => (shouldShowAccountInfo = true)}
				on:mouseleave={() => (shouldShowAccountInfo = false)}
			>
				<button
					class="flex place-items-center place-content-center rounded-full bg-immich-primary/80 h-10 w-10 text-gray-100 hover:bg-immich-primary"
				>
					{getFirstLetter(user.firstName)}{getFirstLetter(user.lastName)}
				</button>

				{#if shouldShowAccountInfo}
					<div
						in:fade={{ delay: 500, duration: 150 }}
						out:fade={{ delay: 200, duration: 150 }}
						class="absolute -bottom-12 right-5 border bg-gray-500 text-[12px] text-gray-100 p-2 rounded-md shadow-md"
					>
						<p>{user.firstName} {user.lastName}</p>
						<p>{user.email}</p>
					</div>
				{/if}
			</div>
		</section>
	</div>
</section>
