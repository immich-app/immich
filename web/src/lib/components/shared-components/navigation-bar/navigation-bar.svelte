<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { clickOutside } from '$lib/utils/click-outside';
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
	import { api, UserResponseDto } from '@api';
	import ThemeButton from '../theme-button.svelte';
	import { AppRoute } from '../../../constants';
	import AccountInfoPanel from './account-info-panel.svelte';
	import ImmichLogo from '../immich-logo.svelte';
	import SearchBar from '../search-bar/search-bar.svelte';
	import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
	import Magnify from 'svelte-material-icons/Magnify.svelte';
	import IconButton from '$lib/components/elements/buttons/icon-button.svelte';
	import Cog from 'svelte-material-icons/Cog.svelte';
	import UserAvatar from '../user-avatar.svelte';
	export let user: UserResponseDto;
	export let showUploadButton = true;

	let shouldShowAccountInfo = false;
	let shouldShowAccountInfoPanel = false;

	const dispatch = createEventDispatcher();

	const logOut = async () => {
		const { data } = await api.authenticationApi.logout();

		await fetch('/auth/logout', { method: 'POST' });

		goto(data.redirectUri || '/auth/login?autoLaunch=0');
	};
</script>

<section id="dashboard-navbar" class="fixed h-[var(--navbar-height)] w-screen z-[900] text-sm">
	<div
		class="grid h-full md:grid-cols-[theme(spacing.64)_auto] grid-cols-[theme(spacing.18)_auto] border-b dark:border-b-immich-dark-gray items-center py-2 bg-immich-bg dark:bg-immich-dark-bg"
	>
		<a
			data-sveltekit-preload-data="hover"
			class="flex gap-2 md:mx-6 mx-4 place-items-center"
			href={AppRoute.PHOTOS}
		>
			<ImmichLogo height="35" width="35" />
			<h1
				class="font-immich-title text-2xl text-immich-primary dark:text-immich-dark-primary md:block hidden"
			>
				IMMICH
			</h1>
		</a>
		<div class="flex justify-between gap-16 pr-6">
			<div class="w-full max-w-5xl flex-1 pl-4 sm:block hidden">
				<SearchBar grayTheme={true} />
			</div>

			<section class="flex gap-4 place-items-center justify-end max-sm:w-full">
				<a href={AppRoute.SEARCH} id="search-button" class="sm:hidden pl-4">
					<IconButton title="Search">
						<div class="flex gap-2">
							<Magnify size="1.5em" />
						</div>
					</IconButton>
				</a>

				<ThemeButton />

				{#if !$page.url.pathname.includes('/admin') && showUploadButton}
					<div in:fly={{ x: 50, duration: 250 }}>
						<LinkButton on:click={() => dispatch('uploadClicked')}>
							<div class="flex gap-2">
								<TrayArrowUp size="1.5em" />
								<span class="md:block hidden">Upload</span>
							</div>
						</LinkButton>
					</div>
				{/if}

				{#if user.isAdmin}
					<a data-sveltekit-preload-data="hover" href={AppRoute.ADMIN_USER_MANAGEMENT}>
						<div class="sm:block hidden">
							<LinkButton>
								<span
									class={$page.url.pathname.includes('/admin')
										? 'text-immich-primary dark:text-immich-dark-primary underline item'
										: ''}
								>
									Administration
								</span>
							</LinkButton>
						</div>
						<div class="sm:hidden block">
							<IconButton title="Administration">
								<Cog
									size="1.5em"
									class="dark:text-immich-dark-fg {$page.url.pathname.includes('/admin')
										? 'text-immich-primary dark:text-immich-dark-primary'
										: ''}"
								/>
							</IconButton>
							<hr
								class={$page.url.pathname.includes('/admin')
									? 'block border-1 w-2/3 mx-auto border-immich-primary dark:border-immich-dark-primary'
									: 'hidden'}
							/>
						</div>
					</a>
				{/if}

				<div use:clickOutside on:outclick={() => (shouldShowAccountInfoPanel = false)}>
					<button
						class="flex"
						on:mouseover={() => (shouldShowAccountInfo = true)}
						on:focus={() => (shouldShowAccountInfo = true)}
						on:blur={() => (shouldShowAccountInfo = false)}
						on:mouseleave={() => (shouldShowAccountInfo = false)}
						on:click={() => (shouldShowAccountInfoPanel = !shouldShowAccountInfoPanel)}
					>
						<UserAvatar {user} size="md" showTitle={false} interactive />
					</button>

					{#if shouldShowAccountInfo && !shouldShowAccountInfoPanel}
						<div
							in:fade={{ delay: 500, duration: 150 }}
							out:fade={{ delay: 200, duration: 150 }}
							class="absolute -bottom-12 right-5 border bg-gray-500 dark:bg-immich-dark-gray text-[12px] text-gray-100 p-2 rounded-md shadow-md dark:border-immich-dark-gray"
						>
							<p>{user.firstName} {user.lastName}</p>
							<p>{user.email}</p>
						</div>
					{/if}

					{#if shouldShowAccountInfoPanel}
						<AccountInfoPanel {user} on:logout={logOut} />
					{/if}
				</div>
			</section>
		</div>
	</div>
</section>

<style>
	:root {
		/* Used by layouts to ensure proper spacing between navbar and content */
		--navbar-height: calc(theme(spacing.18) + 4px);
	}
</style>
