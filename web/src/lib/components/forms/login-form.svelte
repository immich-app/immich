<script lang="ts">
	import { session } from '$app/stores';
	import { sendForm } from '$lib/auth-api';

	let error: string;

	async function registerAdmin(event: SubmitEvent) {
		error = '';

		const formElement = event.target as HTMLFormElement;

		const response = await sendForm(formElement);

		if (response.error) {
			error = JSON.stringify(response.error);
		}

		console.log('sesstion', $session);
		$session.user = response.user;

		// formElement.reset();
	}
</script>

<div class="border bg-white p-4 shadow-sm w-[500px] rounded-md py-8">
	<div class="flex flex-col place-items-center place-content-center gap-4 px-4">
		<img class="text-center" src="/immich-logo.svg" height="100" width="100" alt="immich-logo" />
		<h1 class="text-2xl text-immich-primary font-medium">Login</h1>
	</div>

	<form on:submit|preventDefault={registerAdmin} method="post" action="" autocomplete="off">
		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="email">Email</label>
			<input class="immich-form-input" id="email" name="email" type="email" required />
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="password">Password</label>
			<input class="immich-form-input" id="password" name="password" type="password" required />
		</div>

		{#if error}
			<p class="text-red-400">{error}</p>
		{/if}

		<div class="flex w-full">
			<button
				type="submit"
				class="m-4 p-2 bg-immich-primary hover:bg-immich-primary/75 px-6 py-4 text-white rounded-md shadow-md w-full"
				>Login</button
			>
		</div>
	</form>
</div>
