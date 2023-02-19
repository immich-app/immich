<script lang="ts">
	import { goto } from '$app/navigation';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { loginPageMessage } from '$lib/constants';
	import { handleError } from '$lib/utils/handle-error';
	import { api, oauth, OAuthConfigResponseDto } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import ImmichLogo from '../shared-components/immich-logo.svelte';

	let error: string;
	let email = '';
	let password = '';
	let oauthError: string;
	let authConfig: OAuthConfigResponseDto = { enabled: false, passwordLoginEnabled: false };
	let loading = true;

	const dispatch = createEventDispatcher();

	onMount(async () => {
		if (oauth.isCallback(window.location)) {
			try {
				loading = true;
				await oauth.login(window.location);
				dispatch('success');
				return;
			} catch (e) {
				console.error('Error [login-form] [oauth.callback]', e);
				oauthError = 'Unable to complete OAuth login';
				loading = false;
			}
		}

		try {
			const { data } = await oauth.getConfig(window.location);
			authConfig = data;

			const { enabled, url, autoLaunch } = authConfig;

			if (enabled && url && autoLaunch && !oauth.isAutoLaunchDisabled(window.location)) {
				await goto('/auth/login?autoLaunch=0', { replaceState: true });
				await goto(url);
				return;
			}
		} catch (error) {
			authConfig.passwordLoginEnabled = true;
			handleError(error, 'Unable to connect!');
		}

		loading = false;
	});

	const login = async () => {
		try {
			error = '';
			loading = true;

			const { data } = await api.authenticationApi.login({
				email,
				password
			});

			if (!data.isAdmin && data.shouldChangePassword) {
				dispatch('first-login');
				return;
			}

			dispatch('success');
			return;
		} catch (e) {
			error = 'Incorrect email or password';
			loading = false;
			return;
		}
	};
</script>

<div
	class="border bg-white dark:bg-immich-dark-gray dark:border-immich-dark-gray p-8 shadow-sm w-full max-w-lg rounded-md"
>
	<div class="flex flex-col place-items-center place-content-center gap-4 py-4">
		<ImmichLogo class="text-center h-24 w-24" />
		<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">Login</h1>
	</div>

	{#if loginPageMessage}
		<p
			class="text-sm border rounded-md m-4 p-4 text-immich-primary dark:text-immich-dark-primary font-medium bg-immich-primary/5 dark:border-immich-dark-bg"
		>
			{@html loginPageMessage}
		</p>
	{/if}

	{#if authConfig.passwordLoginEnabled}
		<form on:submit|preventDefault={login} class="flex flex-col gap-5 mt-5">
			{#if error}
				<p class="text-red-400" transition:fade>
					{error}
				</p>
			{/if}

			<div class="flex flex-col gap-2">
				<label class="immich-form-label" for="email">Email</label>
				<input
					class="immich-form-input"
					id="email"
					name="email"
					type="email"
					bind:value={email}
					required
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label class="immich-form-label" for="password">Password</label>
				<input
					class="immich-form-input"
					id="password"
					name="password"
					type="password"
					bind:value={password}
					required
				/>
			</div>

			<div class="my-5 flex w-full">
				<button
					type="submit"
					class="immich-btn-primary-big inline-flex items-center h-14"
					disabled={loading}
				>
					{#if loading}
						<LoadingSpinner />
					{:else}
						Login
					{/if}
				</button>
			</div>
		</form>
	{/if}

	{#if authConfig.enabled}
		{#if authConfig.passwordLoginEnabled}
			<div class="inline-flex items-center justify-center w-full">
				<hr class="w-3/4 h-px my-6 bg-gray-200 border-0 dark:bg-gray-600" />
				<span
					class="absolute px-3 font-medium text-gray-900 -translate-x-1/2 left-1/2 dark:text-white bg-white dark:bg-immich-dark-gray"
				>
					or
				</span>
			</div>
		{/if}
		<div class="my-5 flex flex-col gap-5">
			{#if oauthError}
				<p class="text-red-400" transition:fade>{oauthError}</p>
			{/if}
			<a href={authConfig.url} class="flex w-full">
				<button
					type="button"
					disabled={loading}
					class={authConfig.passwordLoginEnabled
						? 'immich-btn-secondary-big'
						: 'immich-btn-primary-big'}
				>
					{authConfig.buttonText || 'Login with OAuth'}
				</button>
			</a>
		</div>
	{/if}

	{#if !authConfig.enabled && !authConfig.passwordLoginEnabled}
		<p class="text-center dark:text-immich-dark-fg p-4">Login has been disabled.</p>
	{/if}
</div>
