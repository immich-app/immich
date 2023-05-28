<script lang="ts">
	import { api } from '@api';
	import { createEventDispatcher } from 'svelte';
	import ImmichLogo from '../shared-components/immich-logo.svelte';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';
	import Button from '../elements/buttons/button.svelte';

	let error: string;
	let success: string;

	let password = '';
	let confirmPassowrd = '';

	let canCreateUser = false;

	let isCreatingUser = false;

	$: {
		if (password !== confirmPassowrd && confirmPassowrd.length > 0) {
			error = 'Password does not match';
			canCreateUser = false;
		} else {
			error = '';
			canCreateUser = true;
		}
	}
	const dispatch = createEventDispatcher();

	async function registerUser(event: SubmitEvent) {
		if (canCreateUser && !isCreatingUser) {
			isCreatingUser = true;

			error = '';

			const formElement = event.target as HTMLFormElement;

			const form = new FormData(formElement);

			const email = form.get('email');
			const password = form.get('password');
			const firstName = form.get('firstName');
			const lastName = form.get('lastName');

			try {
				const { status } = await api.userApi.createUser({
					createUserDto: {
						email: String(email),
						password: String(password),
						firstName: String(firstName),
						lastName: String(lastName)
					}
				});

				if (status === 201) {
					success = 'New user created';

					dispatch('user-created');

					isCreatingUser = false;
					return;
				} else {
					error = 'Error create user account';
					isCreatingUser = false;
				}
			} catch (e) {
				error = 'Error create user account';
				isCreatingUser = false;

				console.log('[ERROR] registerUser', e);

				notificationController.show({
					message: `Error create new user, check console for more detail`,
					type: NotificationType.Error
				});
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
			Create new user
		</h1>
		<p
			class="text-sm border rounded-md p-4 font-mono text-gray-600 dark:border-immich-dark-bg dark:text-gray-300"
		>
			Please provide your user with the password, they will have to change it on their first sign
			in.
		</p>
	</div>

	<form on:submit|preventDefault={registerUser} autocomplete="off">
		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="email">Email</label>
			<input class="immich-form-input" id="email" name="email" type="email" required />
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="password">Password</label>
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
			<label class="immich-form-label" for="confirmPassword">Confirm Password</label>
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
			<p class="text-red-400 ml-4 text-sm">{error}</p>
		{/if}

		{#if success}
			<p class="text-immich-primary ml-4 text-sm">{success}</p>
		{/if}
		<div class="flex w-full p-4">
			<Button type="submit" disabled={isCreatingUser} fullwidth>Create</Button>
		</div>
	</form>
</div>
