<script lang="ts">
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import { endMaintenance, maintenanceLogin } from '@immich/sdk';
  import { Button, Heading } from '@immich/ui';
  import { t } from 'svelte-i18n';

  async function loadAuth() {
    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    if (token) {
      await maintenanceLogin({
        maintenanceLoginDto: {
          token,
        },
      });

      history.replaceState({}, document.title, AppRoute.MAINTENANCE);

      return token;
    }
  }

  function checkAuth(jwt?: string) {
    try {
      if (!jwt) {
        const jwtCookie = document.cookie
          .split(';')
          .map((cookie) => cookie.split('=', 2).map((value) => value.trim()))
          .find(([name]) => name === 'immich_maintenance_token');

        if (jwtCookie) {
          jwt = jwtCookie[1];
        }
      }

      if (jwt) {
        // decode the JWT
        // https://stackoverflow.com/a/38552302
        const encodedPayload = decodeURIComponent(
          // eslint-disable-next-line unicorn/prefer-string-replace-all
          atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
            .split('')
            // eslint-disable-next-line unicorn/prefer-code-point
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        );

        return JSON.parse(encodedPayload).data as {
          username: string;
        };
      }
    } catch (error) {
      void error;
    }
  }

  let user: { username: string } | undefined;

  void loadAuth().then(() => (user = checkAuth()));
</script>

<AuthPageLayout>
  <div class="flex flex-col place-items-center text-center gap-4">
    <Heading size="large" color="primary" tag="h1">{$t('maintenance_title')}</Heading>
    <p>{$t('maintenance_description')}</p>
    {#if user}
      <p>
        {$t('maintenance_logged_in_as', {
          values: {
            user: user.username,
          },
        })}
      </p>
      <Button onclick={() => endMaintenance()}>{$t('maintenance_exit')}</Button>
    {/if}
  </div>
</AuthPageLayout>
