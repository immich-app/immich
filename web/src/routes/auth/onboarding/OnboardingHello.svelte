<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { OnboardingRole } from '$lib/types';
  import { Logo } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let userRole = $derived(
    authManager.user.isAdmin && !serverConfigManager.value.isOnboarded ? OnboardingRole.SERVER : OnboardingRole.USER,
  );
</script>

<div class="gap-4">
  <Logo variant="icon" size="giant" class="mb-2" />
  <p class="mb-6 text-6xl font-medium text-primary">
    {$t('onboarding_welcome_user', { values: { user: authManager.user.name } })}
  </p>
  <p class="pb-6 text-3xl font-light">
    {userRole == OnboardingRole.SERVER
      ? $t('onboarding_server_welcome_description')
      : $t('onboarding_user_welcome_description')}
  </p>
</div>
