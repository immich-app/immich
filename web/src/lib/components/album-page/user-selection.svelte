<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { api, UserResponseDto } from '@api';
	import AlbumAppBar from './album-app-bar.svelte';

	let users: UserResponseDto[] = [];

	onMount(async () => {
		const { data } = await api.userApi.getAllUsers(false);

		users = data;
	});
</script>

<section
	transition:fly={{ y: 1000, duration: 200, easing: quintOut }}
	class="absolute top-0 left-0 w-full h-full bg-red-500 z-[200]"
>
	<AlbumAppBar>
		<span name="leading"> Leading app bar </span>
	</AlbumAppBar>
	{#each users as user}
		<div>
			{user.id} - {user.firstName}
		</div>
	{/each}
</section>
