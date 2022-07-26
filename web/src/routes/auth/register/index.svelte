<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async () => {
		const { data } = await api.userApi.getUserCount();
		if (data.userCount != 0) {
			// Admin has been registered, redirect to login
			return {
				status: 302,
				redirect: '/auth/login'
			};
		}

		return {
			status: 200
		};
	};
</script>

<script lang="ts">
	import AdminRegistrationForm from '$lib/components/forms/admin-registration-form.svelte';
	import { api } from '@api';
</script>

<svelte:head>
	<title>Admin Registration - Immich</title>
</svelte:head>

<section class="h-screen w-screen flex place-items-center place-content-center">
	<AdminRegistrationForm />
</section>
