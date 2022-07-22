<script lang="ts">
	import { api, UserResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';

	export let user: UserResponseDto;

	// Avatar Size In Pixel
	export let size: number = 48;

	const dispatch = createEventDispatcher();
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
	<button
		on:click={() => dispatch('click')}
		style:width={`${size}px`}
		style:height={`${size}px`}
		class={` rounded-full bg-immich-primary/25`}
	/>
{:then data}
	<button on:click={() => dispatch('click')}>
		<img
			src={data}
			alt="profile-img"
			style:width={`${size}px`}
			style:height={`${size}px`}
			class={`inline rounded-full  object-cover border shadow-md`}
			title={user.email}
		/>
	</button>
{/await}
