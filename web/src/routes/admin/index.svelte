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
	import SideBarButton from '$lib/components/admin/side-bar-button.svelte';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import NavigationBar from '$lib/components/shared/navigation-bar.svelte';
	import { onMount } from 'svelte';

	let selectedAction = '';

	export let user: AuthUser;

	const onButtonClicked = (buttonType: CustomEvent) => {
		console.log('Button Clicked', buttonType.detail['actionType']);
	};

	onMount(() => {
		selectedAction == 'USER';
	});
</script>

<svelte:head>
	<title>Immich - Administration</title>
</svelte:head>

<NavigationBar {user} />

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen">
	<section id="admin-sidebar" class="pt-8 pr-6">
		<SideBarButton title="User" logo={AccountMultipleOutline} on:selected={onButtonClicked} />
	</section>
	<section class="bg-green-200 overflow-y-scroll">
		<div class="bg-blue-300 h-80 w-40">Content block</div>
		<div class="bg-blue-300 h-80 w-40">Content block</div>
		<div class="bg-blue-300 h-80 w-40">Content block</div>
		<div class="bg-blue-300 h-80 w-40">Content block</div>
		<div class="bg-blue-300 h-80 w-40">Content block</div>
		<div class="bg-blue-300 h-80 w-40">Content block</div>
		<div class="bg-blue-300 h-80 w-40">Content block</div>
	</section>
</section>
