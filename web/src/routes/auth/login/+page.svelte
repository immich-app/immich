<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	import LoginForm from '$lib/components/forms/login-form.svelte';
</script>

<section class="h-screen w-screen flex place-items-center place-content-center">
	<div in:fade={{ duration: 100 }} out:fade={{ duration: 100 }}>
		<LoginForm
			on:success={() => goto('/photos')}
			on:first-login={() => goto('/auth/change-password')}
		/>
	</div>
</section>
