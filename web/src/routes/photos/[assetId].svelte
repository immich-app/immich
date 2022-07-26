<script context="module" lang="ts">
	export const prerender = false;

	import { api } from '@api';
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async () => {
		try {
			await api.userApi.getMyUserInfo();
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
