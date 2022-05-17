<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = ({ session }) => {
		console.log('Checking dashboard session');
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

	export let user: AuthUser;
</script>

<h1 class="w-[300px]">Dashboard page {JSON.stringify(user.userEmail)}</h1>
