<script context="module" lang="ts">
	export const prerender = false;

	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ fetch }) => {
		try {
			await fetch('/data/user/get-my-user-info');

			return {
				status: 302,
				redirect: '/photos'
			};
		} catch (e) {
			return {
				status: 302,
				redirect: '/auth/login'
			};
		}
	};
</script>
