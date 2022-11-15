<script lang="ts">
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { loginPageMessage } from '$lib/constants';
	import { api, OAuthConfigResponseDto } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';

	let error: string;
	let email = '';
	let password = '';
	let oauthError: string;
	let oauthConfig: OAuthConfigResponseDto = { enabled: false };
	let loading = true;

	const dispatch = createEventDispatcher();

	onMount(async () => {
		const search = window.location.search;
		if (search.includes('code=') || search.includes('error=')) {
			try {
				loading = true;
				await api.oauthApi.callback({ url: window.location.href });
				dispatch('success');
				return;
			} catch (e) {
				console.error('Error [login-form] [oauth.callback]', e);
				oauthError = 'Unable to complete OAuth login';
				loading = false;
			}
		}

		try {
			const redirectUri = window.location.href.split('?')[0];
			console.log(`OAuth Redirect URI: ${redirectUri}`);
			const { data } = await api.oauthApi.generateConfig({ redirectUri });
			oauthConfig = data;
		} catch (e) {
			console.error('Error [login-form] [oauth.generateConfig]', e);
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
	class="border bg-white dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] rounded-md py-8"
>
	<div class="flex flex-col place-items-center place-content-center gap-4 px-4">
		<img class="text-center" src="/immich-logo.svg" height="100" width="100" alt="immich-logo" />
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

			{#if oauthConfig.enabled}
				<div class="flex flex-col gap-4 px-4">
					<hr />
					{#if oauthError}
						<p class="text-red-400">{oauthError}</p>
					{/if}
					<a href={oauthConfig.url} class="flex w-full">
						<button
							type="button"
							disabled={loading}
							class="bg-immich-primary dark:bg-immich-dark-primary dark:text-immich-dark-gray dark:hover:bg-immich-dark-primary/80 hover:bg-immich-primary/75 px-6 py-4 text-white rounded-md shadow-md w-full font-semibold"
							>{oauthConfig.buttonText || 'Login with OAuth'}</button
						>
					</a>
				</div>
			{/if}
		</form>
	{/if}
</div>
