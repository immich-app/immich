<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = ({ session }) => {
		if (!session.user) {
			return {
				status: 302,
				redirect: '/auth/login',
			};
		}

		return {
			status: 200,
			props: {
				user: session.user,
			},
		};
	};
</script>

<script lang="ts">
	import type { AuthUser } from '$lib/models/auth-user';

	import NavigationBar from '../../lib/components/shared/navigation-bar.svelte';

	export let user: AuthUser;
</script>

<svelte:head>
	<title>Immich - Dashboard</title>
</svelte:head>

<section>
	<NavigationBar {user} />
</section>
