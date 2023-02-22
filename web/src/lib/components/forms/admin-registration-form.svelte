<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '@api';
	import ImmichLogo from '../shared-components/immich-logo.svelte';

	let error: string;
	let success: string;

	let password = '';
	let confirmPassowrd = '';

	let canRegister = false;

	$: {
		if (password !== confirmPassowrd && confirmPassowrd.length > 0) {
			error = 'Password does not match';
			canRegister = false;
		} else {
			error = '';
			canRegister = true;
		}
	}

	async function registerAdmin(event: SubmitEvent) {
		if (canRegister) {
			error = '';

			const formElement = event.target as HTMLFormElement;

			const form = new FormData(formElement);

			const email = form.get('email');
			const password = form.get('password');
			const firstName = form.get('firstName');
			const lastName = form.get('lastName');

			const { status } = await api.authenticationApi.adminSignUp({
				email: String(email),
				password: String(password),
				firstName: String(firstName),
				lastName: String(lastName)
			});

			if (status === 201) {
				goto('/auth/login');
				return;
			} else {
				error = 'Error create admin account';
				return;
			}
		}
	}
</script>

<div
	class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-3xl py-8 dark:text-immich-dark-fg"
>
	<div class="flex flex-col place-items-center place-content-center gap-4 px-4">
		<ImmichLogo class="text-center" height="100" width="100" />
		<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">
			Admin Registration
		</h1>
		<p
			class="text-sm border rounded-md p-4 font-mono text-gray-600 dark:border-immich-dark-bg dark:text-gray-300"
		>
			Since you are the first user on the system, you will be assigned as the Admin and are
			responsible for administrative tasks, and additional users will be created by you.
		</p>
	</div>

	<form on:submit|preventDefault={registerAdmin} method="post" action="" autocomplete="off">
		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="email">Admin Email</label>
			<input class="immich-form-input" id="email" name="email" type="email" required />
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="password">Admin Password</label>
			<input
				class="immich-form-input"
				id="password"
				name="password"
				type="password"
				required
				bind:value={password}
			/>
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="confirmPassword">Confirm Admin Password</label>
			<input
				class="immich-form-input"
				id="confirmPassword"
				name="password"
				type="password"
				required
				bind:value={confirmPassowrd}
			/>
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="firstName">First Name</label>
			<input class="immich-form-input" id="firstName" name="firstName" type="text" required />
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="lastName">Last Name</label>
			<input class="immich-form-input" id="lastName" name="lastName" type="text" required />
		</div>

		{#if error}
			<p class="text-red-400 ml-4">{error}</p>
		{/if}

		{#if success}
			<div>
				<p>Admin account has been registered</p>
				<p>
					<a href="/auth/login">Login</a>
				</p>
			</div>
		{/if}

		<div class="flex w-full">
			<button
				type="submit"
				class="m-4 p-2 bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 dark:text-immich-dark-gray px-6 py-4 text-white rounded-md shadow-md w-full"
				>Sign Up</button
			>
		</div>
	</form>
</div>
