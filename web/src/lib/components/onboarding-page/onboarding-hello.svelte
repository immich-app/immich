<script lang="ts">
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import { user } from '$lib/stores/user.store';
  import { t } from 'svelte-i18n';
  import { OnboardingRole } from '$lib/models/onboarding-role';
  import { serverConfig } from '$lib/stores/server-config.store';

  let userRole = $derived($user.isAdmin && !$serverConfig.isOnboarded ? OnboardingRole.SERVER : OnboardingRole.USER);

  export async function save() {}
</script>

<div>
  <ImmichLogo noText class="h-[50px]" />
  <p class="font-medium text-6xl my-6 text-immich-primary dark:text-immich-dark-primary">
    {$t('onboarding_welcome_user', { values: { user: $user.name } })}
  </p>
  <p class="text-3xl pb-6 font-light">
    {userRole == OnboardingRole.SERVER
      ? $t('onboarding_server_welcome_description')
      : $t('onboarding_user_welcome_description')}
  </p>
</div>
