<script lang="ts">
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { OnboardingRole } from '#lib/types.ts';
  import { Logo } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getServerConfigQuery } from '#lib/queries/server-info.query.ts';

  const query = createPreloadedQuery(getServerConfigQuery);
  const serverConfig = $derived(query.data);

  let userRole = $derived(
    authManager.user.isAdmin && !serverConfig.isOnboarded ? OnboardingRole.SERVER : OnboardingRole.USER,
  );
</script>

<div class="gap-4">
  <Logo variant="icon" size="giant" class="mb-2" />
  <p class="mb-6 text-6xl font-medium text-primary">
    {$t('onboarding_welcome_user', { values: { user: authManager.user.name } })}
  </p>
  <p class="pb-6 text-3xl font-light">
    {userRole === OnboardingRole.SERVER
      ? $t('onboarding_server_welcome_description')
      : $t('onboarding_user_welcome_description')}
  </p>
</div>
