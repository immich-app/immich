<script lang="ts">
	import { loginPageMessage } from '$lib/constants';
	import { api } from '@api';
	import { createEventDispatcher } from 'svelte';

	let error: string;
	let email = '';
	let password = '';

	const dispatch = createEventDispatcher();

	const login = async () => {
		try {
			error = '';

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
				class="m-4 p-2 bg-immich-primary dark:bg-immich-dark-primary dark:text-immich-dark-gray dark:hover:bg-immich-dark-primary/80 hover:bg-immich-primary/75 px-6 py-4 text-white rounded-md shadow-md w-full font-semibold"
				>Login</button
			>
		</div>
	</form>
</div>
