<script context="module" lang="ts">
	export const prerender = false;

	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ session }) => {
		if (!session.user) {
			return {
				status: 302,
				redirect: '/auth/login',
			};
		}

		return {
			status: 302,
			redirect: '/photos',
		};
	};
</script>
