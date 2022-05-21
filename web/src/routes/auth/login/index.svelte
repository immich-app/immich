<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	import LoginForm from '$lib/components/forms/login-form.svelte';
	import UpdateForm from '../../../lib/components/forms/update-form.svelte';
	import SelectAdminForm from '../../../lib/components/forms/select-admin-form.svelte';

	let shouldShowUpdateForm = false;
	let shouldShowSelectAdminForm = false;

	const onLoginSuccess = async () => {
		goto('/photos');
	};

	const onNeedUpdate = () => {
		shouldShowUpdateForm = true;
		shouldShowSelectAdminForm = false;
	};

	const onNeedSelectAdmin = () => {
		shouldShowUpdateForm = false;
		shouldShowSelectAdminForm = true;
	};
</script>

<svelte:head>
	<title>Immich - Login</title>
</svelte:head>

<section class="h-screen w-screen flex place-items-center place-content-center">
	{#if !shouldShowUpdateForm && !shouldShowSelectAdminForm}
		<div in:fade={{ duration: 100 }} out:fade={{ duration: 100 }}>
			<LoginForm on:success={onLoginSuccess} on:need-update={onNeedUpdate} on:need-select-admin={onNeedSelectAdmin} />
		</div>
	{/if}

	{#if shouldShowUpdateForm}
		<div in:fade={{ duration: 100 }} out:fade={{ duration: 100 }}>
			<UpdateForm on:success={onLoginSuccess} />
		</div>
	{/if}

	{#if shouldShowSelectAdminForm}
		<div in:fade={{ duration: 100 }} out:fade={{ duration: 100 }}>
			<SelectAdminForm on:success={onLoginSuccess} />
		</div>
	{/if}
</section>
