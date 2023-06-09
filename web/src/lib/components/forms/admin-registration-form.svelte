<script lang="ts">
	import { goto } from '$app/navigation';
	import { AppRoute } from '$lib/constants';
	import { api } from '@api';
	import Button from '../elements/buttons/button.svelte';

	let error: string;
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

	async function registerAdmin(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		if (canRegister) {
			error = '';

			const form = new FormData(event.currentTarget);

			const email = form.get('email');
			const password = form.get('password');
			const firstName = form.get('firstName');
			const lastName = form.get('lastName');

			const { status } = await api.authenticationApi.adminSignUp({
				signUpDto: {
					email: String(email),
					password: String(password),
					firstName: String(firstName),
					lastName: String(lastName)
				}
			});

			if (status === 201) {
				goto(AppRoute.AUTH_LOGIN);
				return;
			} else {
				error = 'Error create admin account';
				return;
			}
		}
	}
</script>

<form on:submit|preventDefault={registerAdmin} method="post" class="flex flex-col gap-5 mt-5">
	<div class="flex flex-col gap-2">
		<label class="immich-form-label" for="email">Admin Email</label>
		<input
			class="immich-form-input"
			id="email"
			name="email"
			type="email"
			autocomplete="email"
			required
		/>
	</div>

	<div class="flex flex-col gap-2">
		<label class="immich-form-label" for="password">Admin Password</label>
		<input
			class="immich-form-input"
			id="password"
			name="password"
			type="password"
			autocomplete="new-password"
			required
			bind:value={password}
		/>
	</div>

	<div class="flex flex-col gap-2">
		<label class="immich-form-label" for="confirmPassword">Confirm Admin Password</label>
		<input
			class="immich-form-input"
			id="confirmPassword"
			name="password"
			type="password"
			autocomplete="new-password"
			required
			bind:value={confirmPassowrd}
		/>
	</div>

	<div class="flex flex-col gap-2">
		<label class="immich-form-label" for="firstName">First Name</label>
		<input
			class="immich-form-input"
			id="firstName"
			name="firstName"
			type="text"
			autocomplete="given-name"
			required
		/>
	</div>

	<div class="flex flex-col gap-2">
		<label class="immich-form-label" for="lastName">Last Name</label>
		<input
			class="immich-form-input"
			id="lastName"
			name="lastName"
			type="text"
			autocomplete="family-name"
			required
		/>
	</div>

	{#if error}
		<p class="text-red-400">{error}</p>
	{/if}

	<div class="my-5 flex w-full">
		<Button type="submit" size="lg" fullwidth>Sign up</Button>
	</div>
</form>
