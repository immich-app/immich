<script context="module" lang="ts">
	export const prerender = false;

	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ fetch }) => {
		try {
			await fetch('/data/get-my-user-info.json');

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
