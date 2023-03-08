<script lang="ts">
	import { goto } from '$app/navigation';
	import ChangePasswordForm from '$lib/components/forms/change-password-form.svelte';
	import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
	import { AppRoute } from '$lib/constants';
	import type { PageData } from './$types';

	export let data: PageData;

	const onSuccessHandler = async () => {
		await fetch(AppRoute.AUTH_LOGOUT, { method: 'POST' });

		goto(AppRoute.AUTH_LOGIN);
	};
</script>

<FullscreenContainer title={data.meta.title}>
	<p slot="message">
		Hi {data.user.firstName}
		{data.user.lastName} ({data.user.email}),
		<br />
		<br />
		This is either the first time you are signing into the system or a request has been made to change
		your password. Please enter the new password below.
	</p>

	<ChangePasswordForm user={data.user} on:success={onSuccessHandler} />
</FullscreenContainer>
