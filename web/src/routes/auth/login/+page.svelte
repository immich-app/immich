<script lang="ts">
  import { goto } from '$app/navigation';
  import LoginForm from '$lib/components/forms/login-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import { AppRoute } from '$lib/constants';
  import { featureFlags, serverConfig } from '$lib/stores/server-config.store';
  import { Card, CardBody, Text } from '@immich/ui';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

{#if $featureFlags.loaded}
  <FullscreenContainer title={data.meta.title}>
    {#if !!$serverConfig.loginPageMessage}
      <Card variant="subtle" color="secondary">
        <CardBody>
          <Text>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html $serverConfig.loginPageMessage}
          </Text>
        </CardBody>
      </Card>
    {/if}

    <LoginForm
      onSuccess={async () => await goto(AppRoute.PHOTOS, { invalidateAll: true })}
      onFirstLogin={async () => await goto(AppRoute.AUTH_CHANGE_PASSWORD)}
      onOnboarding={async () => await goto(AppRoute.AUTH_ONBOARDING)}
    />
  </FullscreenContainer>
{/if}
