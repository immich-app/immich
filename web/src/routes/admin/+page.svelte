<script lang="ts">
	import { onMount } from 'svelte';

	import { AdminSideBarSelection } from '$lib/models/admin-sidebar-selection';
	import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
	import UserManagement from '$lib/components/admin-page/user-management.svelte';
	import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
	import CreateUserForm from '$lib/components/forms/create-user-form.svelte';
	import EditUserForm from '$lib/components/forms/edit-user-form.svelte';
	import StatusBox from '$lib/components/shared-components/status-box.svelte';
	import type { PageData } from './$types';
	import { api, UserResponseDto } from '@api';

	let selectedAction: AdminSideBarSelection = AdminSideBarSelection.USER_MANAGEMENT;

	export let data: PageData;

	let editUser: UserResponseDto;

	let shouldShowEditUserForm = false;
	let shouldShowCreateUserForm = false;
	let shouldShowInfoPanel = false;

	const onButtonClicked = (buttonType: CustomEvent) => {
		selectedAction = buttonType.detail['actionType'] as AdminSideBarSelection;
	};

	onMount(() => {
		selectedAction = AdminSideBarSelection.USER_MANAGEMENT;
	});

	const onUserCreated = async () => {
		const getAllUsersRes = await api.userApi.getAllUsers(false);
		data.allUsers = getAllUsersRes.data;
		shouldShowCreateUserForm = false;
	};

	const editUserHandler = async (event: CustomEvent) => {
		const { user } = event.detail;
		editUser = user;
		shouldShowEditUserForm = true;
	};

	const onEditUserSuccess = async () => {
		const getAllUsersRes = await api.userApi.getAllUsers(false);
		data.allUsers = getAllUsersRes.data;
		shouldShowEditUserForm = false;
	};

	const onEditPasswordSuccess = async () => {
		const getAllUsersRes = await api.userApi.getAllUsers(false);
		data.allUsers = getAllUsersRes.data;
		shouldShowEditUserForm = false;
		shouldShowInfoPanel = true;
	};
</script>

<svelte:head>
	<title>Administration - Immich</title>
</svelte:head>

<NavigationBar user={data.user} />

{#if shouldShowCreateUserForm}
	<FullScreenModal on:clickOutside={() => (shouldShowCreateUserForm = false)}>
		<CreateUserForm on:user-created={onUserCreated} />
	</FullScreenModal>
{/if}

{#if shouldShowEditUserForm}
	<FullScreenModal on:clickOutside={() => (shouldShowEditUserForm = false)}>
		<EditUserForm
			user={editUser}
			on:edit-success={onEditUserSuccess}
			on:reset-password-success={onEditPasswordSuccess}
		/>
	</FullScreenModal>
{/if}

{#if shouldShowInfoPanel}
	<FullScreenModal on:clickOutside={() => (shouldShowInfoPanel = false)}>
		<div class="border bg-white shadow-sm w-[500px] rounded-3xl p-8 text-sm">
			<h1 class="font-medium text-immich-primary text-lg mb-4">Password reset success</h1>

			<p>
				The user's password has been reset to the default <code
					class="font-bold bg-gray-200 px-2 py-1 rounded-md text-immich-primary">password</code
				>
				<br />
				Please inform the user, and they will need to change the password at the next log-on.
			</p>

			<div class="flex w-full">
				<button
					on:click={() => (shouldShowInfoPanel = false)}
					class="mt-6 bg-immich-primary hover:bg-immich-primary/75 px-6 py-3 text-white rounded-full shadow-md w-full font-medium"
					>Done
				</button>
			</div>
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
					<UserManagement
						allUsers={data.allUsers}
						on:create-user={() => (shouldShowCreateUserForm = true)}
						on:edit-user={editUserHandler}
					/>
				{/if}
			</section>
		</section>
	</section>
</section>
