<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	import LoginForm from '$lib/components/forms/login-form.svelte';
	import UpdateForm from '../../../lib/components/forms/update-form.svelte';

	let shouldShowUpdateForm = false;

	const onLoginSuccess = () => {
		goto('/dashboard');
	};

	const onNeedUpdate = () => {
		shouldShowUpdateForm = true;
	};
</script>

<svelte:head>
	<title>Immich - Login</title>
</svelte:head>

<section class="h-screen w-screen flex place-items-center place-content-center">
	{#if !shouldShowUpdateForm}
		<div in:fade={{ duration: 100 }} out:fade={{ duration: 100 }}>
			<LoginForm on:success={onLoginSuccess} on:need-update={onNeedUpdate} />
		</div>
	{/if}

	{#if shouldShowUpdateForm}
		<div in:fade={{ duration: 100 }} out:fade={{ duration: 100 }}>
			<UpdateForm on:success={onLoginSuccess} />
		</div>
	{/if}
</section>
