<script lang="ts">
	import { api, UserResponseDto } from '@api';
	import { onMount } from 'svelte';

	export let user: UserResponseDto;

	onMount(() => {
		console.log(user);
	});

	const getUserAvatar = async () => {
		try {
			const { data } = await api.userApi.getProfileImage(user.id, {
				responseType: 'blob'
			});

			if (data instanceof Blob) {
				return URL.createObjectURL(data);
			}
		} catch (e) {
			return '/favicon.png';
		}
	};
</script>

{#await getUserAvatar()}
	<div class="w-12 h-12 rounded-full bg-immich-primary/25" />
{:then data}
	<img
		src={data}
		alt="profile-img"
		class="inline rounded-full w-12 h-12 object-cover border shadow-md"
		title={user.email}
	/>
{/await}
