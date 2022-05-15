<script lang="ts">
	import { sendRegisterAdmin } from '$lib/auth_api';
	export let error: string;
	export let success: string;

	async function registerAdmin(event: SubmitEvent) {
		error = '';

		const formElement = event.target as HTMLFormElement;

		const response = await sendRegisterAdmin(formElement);

		if (response.error) {
			error = response.error;
		}

		if (response.success) {
			success = response.success;
		}

		formElement.reset();
	}
</script>

<svelte:head>
	<title>Immich | Admin Registration</title>
	<meta name="description" content="Immich Web Interface" />
</svelte:head>

<section class="h-screen w-screen flex place-items-center place-content-center">
	<div class="border bg-white p-4 shadow-md w-[500px]">
		<form on:submit|preventDefault={registerAdmin} method="post" action="" autocomplete="off">
			<div class="m-4 flex flex-col">
				<label for="email">Admin Email</label>
				<input class="bg-slate-100" id="email" name="email" type="email" required />
			</div>

			<div class="m-4 flex flex-col">
				<label for="password">Admin Password</label>
				<input class="bg-slate-100" id="password" name="password" type="password" required />
			</div>

			{#if error}
				<p class="text-red-400">{error}</p>
			{/if}

			{#if success}
				<div>
					<p>Admin account has been registered</p>
					<p>
						<a href="/auth/login">Login</a>
					</p>
				</div>
			{/if}

			<button type="submit" class="m-4 p-2 bg-green-200">Sign Up</button>
		</form>
	</div>
</section>
