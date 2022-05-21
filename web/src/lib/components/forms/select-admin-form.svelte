<script lang="ts">
	import { session } from '$app/stores';

	import { createEventDispatcher, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { ImmichUser } from '../../models/immich-user';
	import Check from 'svelte-material-icons/Check.svelte';

	let error: string = '';
	let allUsers: Array<ImmichUser> = [];
	let selectedUserId: string;
	const dispatch = createEventDispatcher();

	onMount(async () => {
		const res = await fetch('/auth/login/api/get-users', { method: 'GET' });
		const data = await res.json();
		allUsers = data.allUsers;
	});

	const assignAdmin = async () => {
		const res = await fetch('/auth/login/api/select-admin', {
			method: 'POST',
			body: JSON.stringify({
				id: selectedUserId,
				isAdmin: true,
			}),
		});

		if (res.status === 200) {
			const data = await res.json();

			$session.user = {
				accessToken: '',
				firstName: data.userInfo.firstName,
				lastName: data.userInfo.lastName,
				isAdmin: data.userInfo.isAdmin,
				id: data.userInfo.id,
				email: data.userInfo.email,
			};

			dispatch('success');
		} else {
			error = JSON.stringify(await res.json());
		}
	};
</script>

<div class="border bg-white p-4 shadow-sm w-[500px] rounded-md py-8">
	<div class="flex flex-col place-items-center place-content-center gap-4 px-4">
		<img class="text-center" src="/immich-logo.svg" height="100" width="100" alt="immich-logo" />
		<h1 class="text-2xl text-immich-primary font-medium">Select Admin</h1>
		<p class="text-sm border rounded-md p-4 font-mono text-gray-600">
			There are multiple users on the server, and none have been selected to be the admin. Please assign one as the
			admin, who will be responsible for administrative tasks
		</p>
	</div>

	<div class="text-xs m-4">USERS ON SERVER, CLICK TO SELECT ONE</div>
	<div class="overflow-y-auto rounded-md max-h-[300px] block border mx-4 px-4 py-2">
		{#each allUsers as user, i}
			<div
				class="p-4 flex justify-between place-items-center my-4 rounded-md hover:cursor-pointer shadow-sm bg-gray-50 hover:bg-gray-100"
				on:click={() => (selectedUserId = user.id)}
			>
				<p class="test-sm text-slate-600">{i + 1} | {user.email}</p>

				<!-- Icon -->
				{#if selectedUserId == user.id}
					<div
						in:fade={{ duration: 100 }}
						class="border rounded-full border-gray-300 bg-immich-primary w-8 h-8 flex place-items-center place-content-center"
					>
						<Check color="white" size="24" />
					</div>
				{:else}
					<div in:fade={{ duration: 100 }} class="border rounded-full border-gray-300 w-8 h-8" />
				{/if}
			</div>
		{/each}
	</div>

	{#if error}
		<div class="text-xs m-4 text-red-400">Error: {error}</div>
	{/if}

	<div class="flex w-full">
		<button
			type="submit"
			class="m-4 p-2 bg-immich-primary hover:bg-immich-primary/75 px-6 py-4 text-white rounded-md shadow-md w-full font-semibold"
			on:click={assignAdmin}>Assign as Admin</button
		>
	</div>
</div>
