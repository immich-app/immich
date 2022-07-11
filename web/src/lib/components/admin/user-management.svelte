<script lang="ts">
	import { UserResponseDto } from '@api';

	import { createEventDispatcher } from 'svelte';
	import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
	export let allUsers: Array<UserResponseDto>;

	const dispatch = createEventDispatcher();
</script>

<p class="text-sm">USER LIST</p>

<table class="text-left w-full my-4">
	<thead class="border rounded-md mb-2 bg-gray-50 flex text-immich-primary w-full h-12 ">
		<tr class="flex w-full place-items-center">
			<th class="text-center w-1/4 font-medium text-sm">Email</th>
			<th class="text-center w-1/4 font-medium text-sm">First name</th>
			<th class="text-center w-1/4 font-medium text-sm">Last name</th>
			<th class="text-center w-1/4 font-medium text-sm">Edit</th>
		</tr>
	</thead>
	<tbody class="overflow-y-auto rounded-md w-full max-h-[320px] block border">
		{#each allUsers as user, i}
			<tr
				class={`text-center flex place-items-center w-full border-b h-[80px] ${
					i % 2 == 0 ? 'bg-gray-100' : 'bg-immich-bg'
				}`}
			>
				<td class="text-sm px-4 w-1/4 text-ellipsis">{user.email}</td>
				<td class="text-sm px-4 w-1/4 text-ellipsis">{user.firstName}</td>
				<td class="text-sm px-4 w-1/4 text-ellipsis">{user.lastName}</td>
				<td class="text-sm px-4 w-1/4 text-ellipsis"
					><button
						class="bg-immich-primary text-gray-100 rounded-full p-3 transition-all duration-150 hover:bg-immich-primary/75"
						><PencilOutline size="20" /></button
					></td
				>
			</tr>
		{/each}
	</tbody>
</table>

<button on:click={() => dispatch('createUser')} class="immich-btn-primary">Create user</button>
