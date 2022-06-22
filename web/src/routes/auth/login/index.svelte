<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	import LoginForm from '$lib/components/forms/login-form.svelte';
	import UpdateForm from '../../../lib/components/forms/update-form.svelte';
	import SelectAdminForm from '../../../lib/components/forms/select-admin-form.svelte';
	import {
		AuthorizationRequest,
		AuthorizationServiceConfiguration,
		FetchRequestor, LocalStorageBackend,
		RedirectRequestHandler
	} from "@openid/appauth";
	import {onMount} from "svelte";
	import {serverEndpoint} from "../../../lib/constants";

	let authConfig: AuthorizationServiceConfiguration;
	let localLoginEnabled = true;
	let oauth2LoginEnabled = false;
	let oauth2ClientId: string;

	onMount(async () => {

		const resLoginParams = await fetch(`${serverEndpoint}/auth/loginParams`);

		if (!resLoginParams.ok) {
			console.log('Cannot get login params');
			return;
		}

		const {localAuth, oauth2, discoveryUrl, clientId} = await resLoginParams.json();
		localLoginEnabled = localAuth;
		oauth2LoginEnabled = oauth2;
		oauth2ClientId = clientId;

		if (!oauth2LoginEnabled) {
			return;
		}

		const resDiscovery = await fetch(discoveryUrl);

		if (!resDiscovery.ok) {
			console.log('Cannot fetch OIDC discovery');
			return;
		}

		const { issuer } = await resDiscovery.json();

		AuthorizationServiceConfiguration.fetchFromIssuer(
				issuer,
				new FetchRequestor()
		).then(response => {
			authConfig = response;
			localStorage.setItem('oauth2Config', JSON.stringify(authConfig));
			console.log("Fetched service configuration", response);
		});
	})

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

	const onOAuth2Login = () => {
		const request = new AuthorizationRequest({
			client_id: oauth2ClientId,
			redirect_uri: `${window.location.origin}/auth/callback`,
			scope: 'profile openid email',
			response_type: 'code id_token token',
			state: undefined, // generate random state for CSRF protection
		});

		let handler = new RedirectRequestHandler(new LocalStorageBackend(window.localStorage));

		handler.performAuthorizationRequest(authConfig, request);
	};
</script>

<svelte:head>
	<title>Immich - Login</title>
</svelte:head>

<section class="h-screen w-screen flex place-items-center place-content-center">
	{#if !shouldShowUpdateForm && !shouldShowSelectAdminForm}
		<div in:fade={{ duration: 100 }} out:fade={{ duration: 100 }}>
			<LoginForm on:success={onLoginSuccess}
					   on:need-update={onNeedUpdate}
					   on:need-select-admin={onNeedSelectAdmin}
					   on:oauth2-login={onOAuth2Login}
					   {localLoginEnabled}
					   {oauth2LoginEnabled} />
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
