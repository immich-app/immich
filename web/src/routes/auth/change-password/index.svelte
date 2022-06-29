<script context="module" lang="ts">
	export const prerender = false;

	import type { Load } from '@sveltejs/kit';
	import type { ImmichUser } from '$lib/models/immich-user';

	export const load: Load = async ({ session }) => {
		if (!session.user) {
			return {
				status: 302,
				redirect: '/auth/login',
			};
		}

		try {
			const res = await fetch(serverEndpoint + '/user/me', {
				method: 'GET',
				headers: {
					Authorization: 'Bearer ' + session.user.accessToken,
				},
			});

			const userInfo: ImmichUser = await res.json();

			if (userInfo.shouldChangePassword) {
				return {
					status: 200,
					props: {
						user: userInfo,
					},
				};
			} else {
				return {
					status: 302,
					redirect: '/photos',
				};
			}
		} catch (e) {
			console.log('ERROR Getting user info', e);
			return {
				status: 302,
				redirect: '/photos',
			};
		}
	};
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { session } from '$app/stores';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import ChangePasswordForm from '../../../lib/components/forms/change-password-form.svelte';
	import { serverEndpoint } from '../../../lib/constants';

	export let user: ImmichUser;

	const onSuccessHandler = async () => {
		const res = await fetch('/auth/logout', { method: 'POST' });

		if (res.status == 200 && res.statusText == 'OK') {
			goto('/auth/login');
		}
	};
</script>

<svelte:head>
	<title>Immich - Change Password</title>
</svelte:head>

<section class="h-screen w-screen flex place-items-center place-content-center">
	<div in:fade={{ duration: 100 }} out:fade={{ duration: 100 }}>
		<ChangePasswordForm {user} on:success={onSuccessHandler} />
	</div>
</section>
