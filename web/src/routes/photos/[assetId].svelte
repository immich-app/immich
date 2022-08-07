<script context="module" lang="ts">
	export const prerender = false;

	import { browser } from '$app/env';
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ session }) => {
		if (!browser && !session.user) {
			return {
				status: 302,
				redirect: '/auth/login'
			};
		} else {
			return {
				status: 302,
				redirect: '/photos'
			};
		}
	};
</script>
