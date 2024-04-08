# Guide - Cloudflare Tunnel & OAuth

This assumes you've setup an Auth Provider in Cloudflare Zero Trust Settings/Authentication already. Example setup for [Google here](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/google/).

## 1. In Cloudflare Zero Trust / Networks
Setup a public hostname in Networks/Tunnels for (ie immich.yourdomain.com) in your tunnel with no access control

## 2. In Cloudflare Access, setup a SaaS application called immich
- Follow the OAuth setup for immich [here](https://immich.app/docs/administration/oauth/#prerequisites).
- In Cloudflare setup the redirect URI's for Mobile, Local IP and Hostname ("public hostname" set in step 1 above)
 - Choose OpenID Connect (OIDC)
 - Set "Scopes" to `openid` `email` `profile`
 - You should have at least these setup for Redirect URIs/Origins:
   ```
   app.immich:/
   http://local_IP:2283/auth/login
   http://local_IP:2283/user-settings
   https://immich.yourdomain.com/auth/login
   https://immich.yourdomain.com/user-settings
   ```
   Note: Replace "local_IP" with local LAN IP address for immich server, and "immich.yourdomain.com" with your public domain.

- Disable "Proof Key for Code Exchange (PKCE)"
- Set your App Launcher URL to your https://immich.yourdomain.com/ set in step 1.
- Add a [custom icon link](https://raw.githubusercontent.com/immich-app/immich/main/design/immich-logo.png).
- Under "Policies", add a policy:
 - Policy name: email
 - Action: Allow
 - Create Additional Rules: Include Login Methods: Your Auth provider
- Under Authentication, set it to whichever Identity Providers you want to support.

## 3. In immich:
- Go to Administration/Settings/OAuth Authentication
- Input the values provided by Cloudflare access for Issuer (Issuer URL), Client ID and Client Secret.
- Click Save.

## 4. Optional: Once tested working, you can do the following final steps in immich:
- Enable "Auto Launch" to streamline things.
- Under "Password Authentication", disable it (forcing users to use OAuth).
