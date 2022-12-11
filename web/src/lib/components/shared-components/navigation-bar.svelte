<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
	import { clickOutside } from '../../utils/click-outside';
	import { api, UserResponseDto } from '@api';
	import ThemeButton from './theme-button.svelte';
	import { AppRoute } from '../../constants';

	export let user: UserResponseDto;
	export let shouldShowUploadButton = true;

	let shouldShowAccountInfo = false;
	let shouldShowProfileImage = false;

	const dispatch = createEventDispatcher();
	let shouldShowAccountInfoPanel = false;

	onMount(() => {
		getUserProfileImage();
	});

	const getUserProfileImage = async () => {
		try {
			await api.userApi.getProfileImage(user.id);
			shouldShowProfileImage = true;
		} catch (e) {
			shouldShowProfileImage = false;
		}
	};
	const getFirstLetter = (text?: string) => {
		return text?.charAt(0).toUpperCase();
	};

	const showAccountInfoPanel = () => {
		shouldShowAccountInfoPanel = true;
	};

	const logOut = async () => {
		const { data } = await api.authenticationApi.logout();

		await fetch('auth/logout', { method: 'POST' });

		goto(data.redirectUri || '/auth/login');
	};
</script>

<section
	id="dashboard-navbar"
	class="fixed w-screen  z-[100] bg-immich-bg dark:bg-immich-dark-bg text-sm"
>
	<div class="flex border-b dark:border-b-immich-dark-gray place-items-center px-6 py-2 ">
		<a
			data-sveltekit-preload-data="hover"
			class="flex gap-2 place-items-center hover:cursor-pointer"
			href="/photos"
		>
			<img src="/immich-logo.svg" alt="immich logo" height="35" width="35" />
			<h1 class="font-immich-title text-2xl text-immich-primary dark:text-immich-dark-primary">
				IMMICH
			</h1>
		</a>
		<div class="flex-1 ml-24">
			<input
				class="w-[50%] rounded-md bg-gray-200 dark:bg-immich-dark-gray  px-8 py-4"
				placeholder="Search - Coming soon"
			/>
		</div>
		<section class="flex gap-4 place-items-center">
			<ThemeButton />

			{#if !$page.url.pathname.includes('/admin') && shouldShowUploadButton}
				<button
					in:fly={{ x: 50, duration: 250 }}
					on:click={() => dispatch('uploadClicked')}
					class="immich-text-button dark:hover:bg-immich-dark-primary/25 dark:text-immich-dark-fg"
				>
					<TrayArrowUp size="20" />
					<span> Upload </span>
				</button>
			{/if}

			{#if user.isAdmin}
				<a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_USER_MANAGEMENT}>
					<button
						class={`flex place-items-center place-content-center gap-2 hover:bg-immich-primary/5  dark:hover:bg-immich-dark-primary/25 dark:text-immich-dark-fg p-2 rounded-lg font-medium ${
							$page.url.pathname.includes('/admin') &&
							'text-immich-primary dark:immich-dark-primary underline'
						}`}>Administration</button
					>
				</a>
			{/if}

			<div
				on:mouseover={() => (shouldShowAccountInfo = true)}
				on:focus={() => (shouldShowAccountInfo = true)}
				on:mouseleave={() => (shouldShowAccountInfo = false)}
				on:click={showAccountInfoPanel}
				on:keydown={showAccountInfoPanel}
			>
				<button
					class="flex place-items-center place-content-center rounded-full bg-immich-primary hover:bg-immich-primary/80 h-12 w-12 text-gray-100 dark:text-immich-dark-bg dark:bg-immich-dark-primary"
				>
					{#if shouldShowProfileImage}
						<img
							src={`api/user/profile-image/${user.id}`}
							alt="profile-img"
							class="inline rounded-full h-12 w-12 object-cover shadow-md"
						/>
					{:else}
						{getFirstLetter(user.firstName)}{getFirstLetter(user.lastName)}
					{/if}
				</button>

				{#if shouldShowAccountInfo}
					<div
						in:fade={{ delay: 500, duration: 150 }}
						out:fade={{ delay: 200, duration: 150 }}
						class="absolute -bottom-12 right-5 border bg-gray-500 dark:bg-immich-dark-gray text-[12px] text-gray-100 p-2 rounded-md shadow-md dark:border-immich-dark-gray"
					>
						<p>{user.firstName} {user.lastName}</p>
						<p>{user.email}</p>
					</div>
				{/if}
			</div>
		</section>
	</div>

	{#if shouldShowAccountInfoPanel}
		<div
			in:fade={{ duration: 100 }}
			out:fade={{ duration: 100 }}
			id="account-info-panel"
			class="absolute right-[25px] top-[75px] bg-immich-bg dark:bg-immich-dark-gray dark:border dark:border-immich-dark-gray shadow-lg rounded-2xl w-[360px] text-center z-[100]"
			use:clickOutside
			on:out-click={() => (shouldShowAccountInfoPanel = false)}
		>
			<div class="flex place-items-center place-content-center mt-6">
				<button
					class="flex place-items-center place-content-center rounded-full bg-immich-primary dark:bg-immich-dark-primary dark:immich-dark-primary/80 h-20 w-20 text-gray-100 hover:bg-immich-primary dark:text-immich-dark-bg"
				>
					{#if shouldShowProfileImage}
						<img
							src={`api/user/profile-image/${user.id}`}
							alt="profile-img"
							class="inline rounded-full h-20 w-20 object-cover shadow-md"
						/>
					{:else}
						<div class="text-lg">
							{getFirstLetter(user.firstName)}{getFirstLetter(user.lastName)}
						</div>
					{/if}
				</button>
			</div>

			<p class="text-lg text-immich-primary dark:text-immich-dark-primary font-medium mt-4">
				{user.firstName}
				{user.lastName}
			</p>

			<p class="text-sm text-gray-500 dark:text-immich-dark-fg">{user.email}</p>

			<div class="my-4">
				<hr class="dark:border-immich-dark-bg" />
			</div>

			<div class="mb-6">
				<button
					class="border rounded-3xl px-6 py-2 hover:bg-gray-50 dark:border-immich-dark-gray dark:bg-gray-300 dark:hover:bg-immich-dark-primary"
					on:click={logOut}>Sign Out</button
				>
			</div>
		</div>
	{/if}
</section>
