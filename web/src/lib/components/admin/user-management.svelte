<script lang="ts">
	import { session } from '$app/stores';
	import { post } from '$lib/api';
	import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
	export let usersOnServer: Array<any>;

	const createNewUser = async () => {
		if ($session.user) {
			const newUserInfo = {
				firstName: 'Paulina',
				lastName: 'Nguyen',
				password: 'password',
				email: 'paulina.nguyen@gmail.com',
			};

			const newUser = await post('user', newUserInfo, $session.user.accessToken);
		}
	};
</script>

<p class="text-sm">USER LIST</p>

<table class="text-left w-full my-4">
	<thead class="border rounded-tl-md rounded-tr-md bg-gray-100 flex text-immich-primary w-full h-12 ">
		<tr class="flex w-full place-items-center ">
			<th class="text-center w-1/4 font-medium">Email</th>
			<th class="text-center w-1/4 font-medium">First name</th>
			<th class="text-center w-1/4 font-medium">Last name</th>
			<th class="text-center w-1/4 font-medium">Actions</th>
		</tr>
	</thead>
	<tbody class="overflow-y-scroll w-full max-h-[320px] block border-l border-r border-b">
		{#each usersOnServer as user, i}
			<tr
				class={`text-center flex place-items-center w-full border-b h-[80px] ${
					i % 2 == 0 ? 'bg-gray-50' : 'bg-gray-100'
				}`}
			>
				<td class="text-sm px-4 w-1/4 text-ellipsis">{user.email}</td>
				<td class="text-sm px-4 w-1/4 text-ellipsis">{user.firstName}</td>
				<td class="text-sm px-4 w-1/4 text-ellipsis">{user.lastName}</td>
				<td class="text-sm px-4 w-1/4 text-ellipsis"
					><button
						class="bg-immich-primary text-gray-100 border rounded-full p-3 transition-all duration-150 hover:bg-immich-primary/75"
						><PencilOutline size="20" /></button
					></td
				>
			</tr>
		{/each}
	</tbody>
</table>

<button on:click={createNewUser} class="immich-btn-primary">Create user</button>
