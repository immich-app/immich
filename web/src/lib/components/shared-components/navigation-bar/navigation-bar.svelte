<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
	import { api, UserResponseDto } from '@api';
	import ThemeButton from '../theme-button.svelte';
	import { AppRoute } from '../../../constants';
	import AccountInfoPanel from './account-info-panel.svelte';
	import ImmichLogo from '../immich-logo.svelte';
	export let user: UserResponseDto;
	export let shouldShowUploadButton = true;

	let shouldShowAccountInfo = false;

	const dispatch = createEventDispatcher();
	let shouldShowAccountInfoPanel = false;

	onMount(() => {
		getUserProfileImage();
	});

	const getUserProfileImage = async () => {
		return await api.userApi.getProfileImage(user.id);
	};
	const getFirstLetter = (text?: string) => {
		return text?.charAt(0).toUpperCase();
	};

	const showAccountInfoPanel = () => {
		shouldShowAccountInfoPanel = true;
	};

	const logOut = async () => {
		const { data } = await api.authenticationApi.logout();

		await fetch('/auth/logout', { method: 'POST' });

		goto(data.redirectUri || '/auth/login?autoLaunch=0');
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
			<ImmichLogo height="35" width="35" />
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
					{#await getUserProfileImage() then}
						<img
							transition:fade={{ duration: 100 }}
							src={`${$page.url.origin}/api/user/profile-image/${user.id}`}
							alt="profile-img"
							class="inline rounded-full h-12 w-12 object-cover shadow-md"
							draggable="false"
						/>
					{:catch}
						{getFirstLetter(user.firstName)}{getFirstLetter(user.lastName)}
					{/await}
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
		<AccountInfoPanel
			{user}
			on:close={() => (shouldShowAccountInfoPanel = false)}
			on:logout={logOut}
		/>
	{/if}
</section>
