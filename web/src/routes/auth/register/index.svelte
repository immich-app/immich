<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	import { serverEndpoint } from '$lib/constants';

	export const load: Load = async ({ session, fetch }) => {
		const res = await fetch(`${serverEndpoint}/user/count`);
		const { userCount } = await res.json();

		if (userCount != 0) {
			// Admin has been registered, redirect to login

			if (!session.user) {
				return {
					status: 302,
					redirect: '/auth/login',
				};
			} else {
				return {
					status: 302,
					redirect: '/dashboard',
				};
			}
		}

		return {};
	};
</script>

<script lang="ts">
	import AdminRegistrationForm from '$lib/components/forms/admin-registration-form.svelte';
</script>

<svelte:head>
	<title>Immich - Admin Registration</title>
</svelte:head>

<section class="h-screen w-screen flex place-items-center place-content-center">
	<AdminRegistrationForm />
</section>
