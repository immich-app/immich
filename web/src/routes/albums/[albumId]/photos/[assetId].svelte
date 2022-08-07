<script context="module" lang="ts">
	export const prerender = false;
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ params }) => {
		try {
			await fetch('/data/user/get-my-user-info');
		} catch (e) {
			return {
				status: 302,
				redirect: '/auth/login'
			};
		}

		const albumId = params['albumId'];

		if (albumId) {
			return {
				status: 302,
				redirect: `/albums/${albumId}`
			};
		} else {
			return {
				status: 302,
				redirect: `/photos`
			};
		}
	};
</script>
