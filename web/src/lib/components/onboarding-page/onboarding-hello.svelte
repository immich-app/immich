<script lang="ts">
  import { OnboardingRole } from '$lib/models/onboarding-role';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { Logo } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let userRole = $derived($user.isAdmin && !$serverConfig.isOnboarded ? OnboardingRole.SERVER : OnboardingRole.USER);
</script>

<div class="gap-4">
  <Logo variant="icon" size="giant" class="mb-2" />
  <p class="font-medium mb-6 text-6xl text-primary">
    {$t('onboarding_welcome_user', { values: { user: $user.name } })}
  </p>
  <p class="text-3xl pb-6 font-light">
    {userRole == OnboardingRole.SERVER
      ? $t('onboarding_server_welcome_description')
      : $t('onboarding_user_welcome_description')}
  </p>
</div>
