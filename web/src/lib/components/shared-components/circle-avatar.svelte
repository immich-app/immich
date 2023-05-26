<script lang="ts">
	import { api, UserResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';

	export let user: UserResponseDto;

	// Avatar Size In Pixel
	export let size = 48;

	const dispatch = createEventDispatcher();

	const getUserAvatar = async () => {
		const { data } = await api.userApi.getProfileImage(
			{ userId: user.id },
			{
				responseType: 'blob'
			}
		);

		if (data instanceof Blob) {
			return URL.createObjectURL(data);
		}
	};

	const getFirstLetter = (text?: string) => {
		return text?.charAt(0).toUpperCase();
	};

	const getRandomeBackgroundColor = () => {
		const colors = ['#DE7FB3', '#E64132', '#FFB800', '#4081EF', '#31A452'];
		return colors[Math.floor(Math.random() * colors.length)];
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
			draggable="false"
		/>
	</button>
{:catch}
	<button
		on:click={() => dispatch('click')}
		style:width={`${size}px`}
		style:height={`${size}px`}
		style:background-color={getRandomeBackgroundColor()}
		class="inline rounded-full object-cover shadow-sm text-white font-semibold"
	>
		<div title={user.email}>
			{getFirstLetter(user.firstName)}{getFirstLetter(user.lastName)}
		</div>
	</button>
{/await}
