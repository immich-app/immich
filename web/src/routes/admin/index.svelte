<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	import { api, UserResponseDto } from '@api';

	export const load: Load = async ({ fetch, session }) => {
		if (!browser && !session.user) {
			return {
				status: 302,
				redirect: '/auth/login'
			};
		}

		try {
			const [user, allUsers] = await Promise.all([
				fetch('/data/user/get-my-user-info').then((r) => r.json()),
				fetch('/data/user/get-all-users?isAll=false').then((r) => r.json())
			]);

			return {
				status: 200,
				props: {
					user: user,
					allUsers: allUsers
				}
			};
		} catch (e) {
			return {
				status: 302,
				redirect: '/auth/login'
			};
		}
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import type { ImmichUser } from '$lib/models/immich-user';
	import { AdminSideBarSelection } from '$lib/models/admin-sidebar-selection';
	import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
	import UserManagement from '$lib/components/admin-page/user-management.svelte';
	import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
	import CreateUserForm from '$lib/components/forms/create-user-form.svelte';
	import StatusBox from '$lib/components/shared-components/status-box.svelte';
	import { browser } from '$app/env';

	let selectedAction: AdminSideBarSelection = AdminSideBarSelection.USER_MANAGEMENT;

	export let user: ImmichUser;
	export let allUsers: UserResponseDto[];

	let shouldShowCreateUserForm: boolean;

	const onButtonClicked = (buttonType: CustomEvent) => {
		selectedAction = buttonType.detail['actionType'] as AdminSideBarSelection;
	};

	onMount(() => {
		selectedAction = AdminSideBarSelection.USER_MANAGEMENT;
	});

	const onUserCreated = async () => {
		const { data } = await api.userApi.getAllUsers(false);
		allUsers = data;

		shouldShowCreateUserForm = false;
	};
</script>

<svelte:head>
	<title>Administration - Immich</title>
</svelte:head>

<NavigationBar {user} />

{#if shouldShowCreateUserForm}
	<FullScreenModal on:clickOutside={() => (shouldShowCreateUserForm = false)}>
		<div>
			<CreateUserForm on:user-created={onUserCreated} />
		</div>
	</FullScreenModal>
{/if}

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen">
	<section id="admin-sidebar" class="pt-8 pr-6 flex flex-col">
		<SideBarButton
			title="User"
			logo={AccountMultipleOutline}
			actionType={AdminSideBarSelection.USER_MANAGEMENT}
			isSelected={selectedAction === AdminSideBarSelection.USER_MANAGEMENT}
			on:selected={onButtonClicked}
		/>

		<div class="mb-6 mt-auto">
			<StatusBox />
		</div>
	</section>
	<section class="overflow-y-auto relative">
		<div id="setting-title" class="pt-10 fixed w-full z-50 bg-immich-bg">
			<h1 class="text-lg ml-8 mb-4 text-immich-primary font-medium">{selectedAction}</h1>
			<hr />
		</div>

		<section id="setting-content" class="relative pt-[85px] flex place-content-center">
			<section class="w-[800px] pt-4">
				{#if selectedAction === AdminSideBarSelection.USER_MANAGEMENT}
					<UserManagement {allUsers} on:createUser={() => (shouldShowCreateUserForm = true)} />
				{/if}
			</section>
		</section>
	</section>
</section>
