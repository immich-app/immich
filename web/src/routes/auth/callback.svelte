<script lang="ts">
    import {
        AuthorizationNotifier,
        BaseTokenRequestHandler,
        FetchRequestor,
        GRANT_TYPE_AUTHORIZATION_CODE,
        LocalStorageBackend,
        RedirectRequestHandler,
        TokenRequest
    } from "@openid/appauth";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    let accessToken: string;
    let refreshToken: string; // todo use refresh token to renew id_token

    const makeRefreshTokenRequest = async (code: string, codeVerifier: string|undefined, clientId: string, redirectUri: string) => {
        let authConfig = JSON.parse(localStorage.getItem('oauth2Config'));

        // use the code to make the token request.
        let request = new TokenRequest({
            client_id: clientId,
            redirect_uri: redirectUri,
            grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
            code: code,
            refresh_token: undefined,
            extras: {
                code_verifier: codeVerifier
            }
        });

        (new BaseTokenRequestHandler(new FetchRequestor()))
            .performTokenRequest(authConfig, request)
            .then(response => {
                accessToken = response.idToken;
                refreshToken = response.refreshToken;
            });
    }

    onMount(async () => {
        let handler = new RedirectRequestHandler(new LocalStorageBackend(window.localStorage));
        let notifier = new AuthorizationNotifier();

        notifier.setAuthorizationListener((request, response, error) => {
            if (response) {
                let codeVerifier: string | undefined;
                if(request.internal && request.internal.code_verifier) {
                    codeVerifier = request.internal.code_verifier;
                }

                makeRefreshTokenRequest(response.code, codeVerifier, request.clientId, request.redirectUri)
                    .then(() => {
                        console.log("Authentication with OAuth2 complete!");
                    });
            }
        });

        handler.setAuthorizationNotifier(notifier);
        await handler.completeAuthorizationRequestIfPossible();

        await goto('/photos');
    });
</script>