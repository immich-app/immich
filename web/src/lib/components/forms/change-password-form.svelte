<script lang="ts">
	import { api, UserResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';
	import Button from '../elements/buttons/button.svelte';

	export let user: UserResponseDto;
	let error: string;
	let success: string;

	let password = '';
	let confirmPassowrd = '';

	let changeChagePassword = false;

	$: {
		if (password !== confirmPassowrd && confirmPassowrd.length > 0) {
			error = 'Password does not match';
			changeChagePassword = false;
		} else {
			error = '';
			changeChagePassword = true;
		}
	}

	const dispatch = createEventDispatcher();

	async function changePassword() {
		if (changeChagePassword) {
			error = '';

			const { status } = await api.userApi.updateUser({
				updateUserDto: {
					id: user.id,
					password: String(password),
					shouldChangePassword: false
				}
			});

			if (status === 200) {
				dispatch('success');
				return;
			} else {
				console.error('Error changing password');
			}
		}
	}
</script>

<form on:submit|preventDefault={changePassword} method="post" class="flex flex-col gap-5 mt-5">
	<div class="flex flex-col gap-2">
		<label class="immich-form-label" for="password">New Password</label>
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
		<label class="immich-form-label" for="confirmPassword">Confirm Password</label>
		<input
			class="immich-form-input"
			id="confirmPassword"
			name="password"
			type="password"
			autocomplete="current-password"
			required
			bind:value={confirmPassowrd}
		/>
	</div>

	{#if error}
		<p class="text-red-400 text-sm">{error}</p>
	{/if}

	{#if success}
		<p class="text-immich-primary text-sm">{success}</p>
	{/if}
	<div class="my-5 flex w-full">
		<Button type="submit" size="lg" fullwidth>Change password</Button>
	</div>
</form>
