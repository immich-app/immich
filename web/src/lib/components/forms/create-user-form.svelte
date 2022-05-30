<script lang="ts">
	import { sendRegistrationForm } from '$lib/auth-api';
	import { createEventDispatcher } from 'svelte';

	let error: string;
	let success: string;

	const dispatch = createEventDispatcher();

	async function registerUser(event: SubmitEvent) {
		error = '';

		const formElement = event.target as HTMLFormElement;

		const response = await sendRegistrationForm(formElement);

		if (response.error) {
			error = JSON.stringify(response.error);
		}

		if (response.success) {
			success = 'New user created';

			dispatch('user-created');
		}
	}
</script>

<div class="border bg-white p-4 shadow-sm w-[500px] rounded-md py-8">
	<div class="flex flex-col place-items-center place-content-center gap-4 px-4">
		<img class="text-center" src="/immich-logo.svg" height="100" width="100" alt="immich-logo" />
		<h1 class="text-2xl text-immich-primary font-medium">Create new user</h1>
		<p class="text-sm border rounded-md p-4 font-mono text-gray-600">
			Please provide your user with the password, they will have to change it on their first sign in.
		</p>
	</div>

	<form on:submit|preventDefault={registerUser} method="post" action="/admin/api/create-user" autocomplete="off">
		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="email">Email</label>
			<input class="immich-form-input" id="email" name="email" type="email" required />
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="password">Password</label>
			<input class="immich-form-input" id="password" name="password" type="password" required />
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="password">First Name</label>
			<input class="immich-form-input" id="firstName" name="firstName" type="text" required />
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="password">Last Name</label>
			<input class="immich-form-input" id="lastName" name="lastName" type="text" required />
		</div>

		{#if error}
			<p class="text-red-400">{error}</p>
		{/if}

		{#if success}
			<p class="text-immich-primary">{success}</p>
		{/if}
		<div class="flex w-full">
			<button
				type="submit"
				class="m-4 p-2 bg-immich-primary hover:bg-immich-primary/75 px-6 py-4 text-white rounded-md shadow-md w-full"
				>Create</button
			>
		</div>
	</form>
</div>
