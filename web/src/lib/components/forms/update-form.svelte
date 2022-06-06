<script lang="ts">
	import { goto } from '$app/navigation';
	import { session } from '$app/stores';
	import { sendUpdateForm } from '$lib/auth-api';
	import { createEventDispatcher } from 'svelte';

	let error: string;
	const dispatch = createEventDispatcher();

	async function updateInfo(event: SubmitEvent) {
		error = '';

		const formElement = event.target as HTMLFormElement;

		const response = await sendUpdateForm(formElement);

		if (response.error) {
			error = response.error;
		}

		if (response.success) {
			$session.user = {
				accessToken: response.user!.accessToken,
				firstName: response.user!.firstName,
				lastName: response.user!.lastName,
				isAdmin: response.user!.isAdmin,
				id: response.user!.id,
				email: response.user!.email,
			};

			dispatch('success');
		}
	}
</script>

<div class="border bg-white p-4 shadow-sm w-[500px] rounded-md py-8">
	<div class="flex flex-col place-items-center place-content-center gap-4 px-4">
		<img class="text-center" src="/immich-logo.svg" height="100" width="100" alt="immich-logo" />
		<h1 class="text-2xl text-immich-primary font-medium">Update User Info</h1>
		<p class="text-sm border rounded-md p-4 font-mono text-gray-600">
			Your account doesn't have information about your name, please update to continue the login process.
		</p>
	</div>

	<form on:submit|preventDefault={updateInfo} method="post" action="/auth/login/update" autocomplete="off">
		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="firstName">First name</label>
			<input class="immich-form-input" id="firstName" name="firstName" type="text" required />
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="lastName">Last name</label>
			<input class="immich-form-input" id="lastName" name="lastName" type="text" required />
		</div>

		{#if error}
			<p class="text-red-400 pl-4">{error}</p>
		{/if}

		<div class="flex w-full">
			<button
				type="submit"
				class="m-4 p-2 bg-immich-primary hover:bg-immich-primary/75 px-6 py-4 text-white rounded-md shadow-md w-full font-semibold"
				>Update</button
			>
		</div>
	</form>
</div>
