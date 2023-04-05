<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
	import { api, UserResponseDto } from '@api';
	import ThemeButton from '../theme-button.svelte';
	import { AppRoute } from '../../../constants';
	import AccountInfoPanel from './account-info-panel.svelte';
	import ImmichLogo from '../immich-logo.svelte';
	import SearchBar from '../search-bar/search-bar.svelte';
	export let user: UserResponseDto;
	export let shouldShowUploadButton = true;

	let shouldShowAccountInfo = false;

	// Show fallback while loading profile picture and hide when image loads.
	let showProfilePictureFallback = true;

	const dispatch = createEventDispatcher();
	let shouldShowAccountInfoPanel = false;

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

<section id="dashboard-navbar" class="fixed h-[4.25rem] w-screen z-[900] text-sm">
	<div
		class="grid grid-cols-[250px_auto] border-b dark:border-b-immich-dark-gray items-center py-2 bg-immich-bg dark:bg-immich-dark-bg"
	>
		<a
			data-sveltekit-preload-data="hover"
			class="flex gap-2 mx-6 place-items-center"
			href={AppRoute.PHOTOS}
		>
			<ImmichLogo height="35" width="35" />
			<h1 class="font-immich-title text-2xl text-immich-primary dark:text-immich-dark-primary">
				IMMICH
			</h1>
		</a>
		<div class="flex justify-between gap-16 pr-6">
			<div class="w-full max-w-5xl flex-1 pl-4">
				<SearchBar grayTheme={true} />
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
						{#if user.profileImagePath}
							<img
								transition:fade={{ duration: 100 }}
								class:hidden={showProfilePictureFallback}
								src={`${$page.url.origin}/api/user/profile-image/${user.id}`}
								alt="profile-img"
								class="inline rounded-full h-12 w-12 object-cover shadow-md border-2 border-immich-primary hover:border-immich-dark-primary dark:hover:border-immich-primary dark:border-immich-dark-primary transition-all"
								draggable="false"
								on:load={() => (showProfilePictureFallback = false)}
							/>
						{/if}
						{#if showProfilePictureFallback}
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
	</div>

	{#if shouldShowAccountInfoPanel}
		<AccountInfoPanel
			{user}
			on:close={() => (shouldShowAccountInfoPanel = false)}
			on:logout={logOut}
		/>
	{/if}
</section>
