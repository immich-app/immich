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

    let accessToken: string;
    let refreshToken: string;
    let redirectUri: string;

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
            })
            .then(async () => {
                let data = new URLSearchParams({
                    'id_token': accessToken,
                    'refresh_token': refreshToken,
                });

                await fetch(redirectUri, {
                    method: 'POST',
                    headers: new Headers({
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }),
                    body: data,
                });
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

                redirectUri = request.redirectUri;

                makeRefreshTokenRequest(response.code, codeVerifier, request.clientId, request.redirectUri)
                    .then(() => {
                        console.log("Authentication with OAuth2 complete!");
                        // todo redirect to home page
                    });
            }
        });

        handler.setAuthorizationNotifier(notifier);
        await handler.completeAuthorizationRequestIfPossible();
    });
</script>