<script lang="ts">
	import { goto } from '$app/navigation';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { loginPageMessage } from '$lib/constants';
	import { handleError } from '$lib/utils/handle-error';
	import { api, oauth, OAuthConfigResponseDto } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';

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
	class="border bg-white dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-md py-8"
>
	<div class="flex flex-col place-items-center place-content-center gap-4 px-4">
		<img
			class="text-center"
			src="/immich-logo.svg"
			height="100"
			width="100"
			alt="immich-logo"
			draggable="false"
		/>
		<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">Login</h1>
	</div>

	{#if loginPageMessage}
		<p
			class="text-sm border rounded-md m-4 p-4 text-immich-primary dark:text-immich-dark-primary font-medium bg-immich-primary/5 dark:border-immich-dark-bg"
		>
			{@html loginPageMessage}
		</p>
	{/if}

	{#if loading}
		<div class="flex place-items-center place-content-center">
			<LoadingSpinner />
		</div>
	{:else}
		{#if authConfig.passwordLoginEnabled}
			<form on:submit|preventDefault={login} autocomplete="off">
				<div class="m-4 flex flex-col gap-2">
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

				<div class="m-4 flex flex-col gap-2">
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

				{#if error}
					<p class="text-red-400 pl-4">{error}</p>
				{/if}

				<div class="flex w-full">
					<button
						type="submit"
						disabled={loading}
						class="m-4 p-2 bg-immich-primary dark:bg-immich-dark-primary dark:text-immich-dark-gray dark:hover:bg-immich-dark-primary/80 hover:bg-immich-primary/75 px-6 py-4 text-white rounded-md shadow-md w-full font-semibold"
						>Login</button
					>
				</div>
			</form>
		{/if}

		{#if authConfig.enabled}
			<div class="flex flex-col gap-4 px-4">
				{#if authConfig.passwordLoginEnabled}
					<hr />
				{/if}
				{#if oauthError}
					<p class="text-red-400">{oauthError}</p>
				{/if}
				<a href={authConfig.url} class="flex w-full">
					<button
						type="button"
						disabled={loading}
						class="bg-immich-primary dark:bg-immich-dark-primary dark:text-immich-dark-gray dark:hover:bg-immich-dark-primary/80 hover:bg-immich-primary/75 px-6 py-4 text-white rounded-md shadow-md w-full font-semibold"
						>{authConfig.buttonText || 'Login with OAuth'}</button
					>
				</a>
			</div>
		{/if}

		{#if !authConfig.enabled && !authConfig.passwordLoginEnabled}
			<p class="text-center dark:text-immich-dark-fg p-4">Login has been disabled.</p>
		{/if}
	{/if}
</div>
