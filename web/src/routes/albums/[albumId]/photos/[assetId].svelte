<script context="module" lang="ts">
	export const prerender = false;

	import { api } from '@api';
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ params }) => {
		try {
			await api.userApi.getMyUserInfo();
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
