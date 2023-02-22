<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	import ChangePasswordForm from '$lib/components/forms/change-password-form.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const onSuccessHandler = async () => {
		await fetch('auth/logout', { method: 'POST' });

		goto('/auth/login');
	};
</script>

<section class="h-screen w-screen flex place-items-center place-content-center">
	<div in:fade={{ duration: 100 }} out:fade={{ duration: 100 }}>
		<ChangePasswordForm user={data.user} on:success={onSuccessHandler} />
	</div>
</section>
