<script lang="ts">
	import { UserResponseDto } from '@api';

	import { createEventDispatcher } from 'svelte';
	import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
	import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';
	import DeleteRestore from 'svelte-material-icons/DeleteRestore.svelte';
	import moment from 'moment';

	export let allUsers: Array<UserResponseDto>;

	const dispatch = createEventDispatcher();

	const isDeleted = (user: UserResponseDto): boolean => {
		return user.deletedAt != null;
	};

	const getDeleteDate = (user: UserResponseDto): string => {
		return moment(user.deletedAt).add(7, 'days').format('LL');
	};
</script>

<table class="text-left w-full my-5">
	<thead
		class="border rounded-md mb-4 bg-gray-50 flex text-immich-primary w-full h-12 dark:bg-immich-dark-gray dark:text-immich-dark-primary dark:border-immich-dark-gray"
	>
		<tr class="flex w-full place-items-center">
			<th class="text-center w-1/4 font-medium text-sm">Email</th>
			<th class="text-center w-1/4 font-medium text-sm">First name</th>
			<th class="text-center w-1/4 font-medium text-sm">Last name</th>
			<th class="text-center w-1/4 font-medium text-sm">Action</th>
		</tr>
	</thead>
	<tbody
		class="overflow-y-auto rounded-md w-full max-h-[320px] block border dark:border-immich-dark-gray"
	>
		{#each allUsers as user, i}
			<tr
				class={`text-center flex place-items-center w-full h-[80px] dark:text-immich-dark-bg ${
					isDeleted(user)
						? 'bg-red-50'
						: i % 2 == 0
						? 'bg-immich-gray dark:bg-[#e5e5e5]'
						: 'bg-immich-bg dark:bg-[#eeeeee]'
				}`}
			>
				<td class="text-sm px-4 w-1/4 text-ellipsis">{user.email}</td>
				<td class="text-sm px-4 w-1/4 text-ellipsis">{user.firstName}</td>
				<td class="text-sm px-4 w-1/4 text-ellipsis">{user.lastName}</td>
				<td class="text-sm px-4 w-1/4 text-ellipsis">
					{#if !isDeleted(user)}
						<button
							on:click={() => {
								dispatch('edit-user', { user });
							}}
							class="bg-immich-primary dark:bg-immich-dark-primary text-gray-100 dark:text-gray-700  rounded-full p-3 transition-all duration-150 hover:bg-immich-primary/75"
							><PencilOutline size="16" /></button
						>
						<button
							on:click={() => {
								dispatch('delete-user', { user });
							}}
							class="bg-immich-primary dark:bg-immich-dark-primary text-gray-100 dark:text-gray-700  rounded-full p-3 transition-all duration-150 hover:bg-immich-primary/75"
							><TrashCanOutline size="16" /></button
						>
					{/if}
					{#if isDeleted(user)}
						<button
							on:click={() => {
								dispatch('restore-user', { user });
							}}
							class="bg-immich-primary dark:bg-immich-dark-primary text-gray-100 dark:text-gray-700  rounded-full p-3 transition-all duration-150 hover:bg-immich-primary/75"
							title={`scheduled removal on ${getDeleteDate(user)}`}
							><DeleteRestore size="16" /></button
						>
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<button on:click={() => dispatch('create-user')} class="immich-btn-primary">Create user</button>
