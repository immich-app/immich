<script context="module" lang="ts">
	export const prerender = false;

	import { goto } from '$app/navigation';
	import NavigationBar from '$lib/components/shared/navigation-bar.svelte';
	import SideBarButton from '$lib/components/shared/side-bar-button.svelte';
	import StatusBox from '$lib/components/shared/status-box.svelte';
	import { AppSideBarSelection } from '$lib/models/admin-sidebar-selection';
	import { ImmichUser } from '$lib/models/immich-user';
	import type { Load } from '@sveltejs/kit';
	import { onMount } from 'svelte';

	export const load: Load = async ({ session }) => {
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
	import SideBar from '$lib/components/shared/side-bar.svelte';

	export let user: ImmichUser;
</script>

<svelte:head>
	<title>Albums - Immich</title>
</svelte:head>

<section>
	<NavigationBar {user} on:uploadClicked={() => {}} />
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg">
	<SideBar />
</section>
