<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import OnboardingBackup from '$lib/components/onboarding-page/onboarding-backup.svelte';
  import OnboardingCard from '$lib/components/onboarding-page/onboarding-card.svelte';
  import OnboardingHello from '$lib/components/onboarding-page/onboarding-hello.svelte';
  import OnboardingLocale from '$lib/components/onboarding-page/onboarding-language.svelte';
  import OnboardingMobileApp from '$lib/components/onboarding-page/onboarding-mobile-app.svelte';
  import OnboardingServerPrivacy from '$lib/components/onboarding-page/onboarding-server-privacy.svelte';
  import OnboardingStorageTemplate from '$lib/components/onboarding-page/onboarding-storage-template.svelte';
  import OnboardingTheme from '$lib/components/onboarding-page/onboarding-theme.svelte';
  import OnboardingUserPrivacy from '$lib/components/onboarding-page/onboarding-user-privacy.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { OnboardingRole } from '$lib/models/onboarding-role';
  import { user } from '$lib/stores/user.store';
  import { setUserOnboarding, updateAdminOnboarding } from '@immich/sdk';
  import {
    mdiCellphoneArrowDownVariant,
    mdiCloudCheckOutline,
    mdiHarddisk,
    mdiIncognito,
    mdiThemeLightDark,
    mdiTranslate,
  } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface OnboardingStep {
    name: string;
    component:
      | typeof OnboardingHello
      | typeof OnboardingTheme
      | typeof OnboardingStorageTemplate
      | typeof OnboardingServerPrivacy
      | typeof OnboardingUserPrivacy
      | typeof OnboardingMobileApp
      | typeof OnboardingLocale;
    role: OnboardingRole;
    title?: string;
    icon?: string;
  }

  const onboardingSteps: OnboardingStep[] = $derived([
    { name: 'hello', component: OnboardingHello, role: OnboardingRole.USER },
    {
      name: 'theme',
      component: OnboardingTheme,
      role: OnboardingRole.USER,
      title: $t('theme'),
      icon: mdiThemeLightDark,
    },
    {
      name: 'language',
      component: OnboardingLocale,
      role: OnboardingRole.USER,
      title: $t('language'),
      icon: mdiTranslate,
    },
    {
      name: 'server_privacy',
      component: OnboardingServerPrivacy,
      role: OnboardingRole.SERVER,
      title: $t('server_privacy'),
      icon: mdiIncognito,
    },
    {
      name: 'user_privacy',
      component: OnboardingUserPrivacy,
      role: OnboardingRole.USER,
      title: $t('user_privacy'),
      icon: mdiIncognito,
    },
    {
      name: 'storage_template',
      component: OnboardingStorageTemplate,
      role: OnboardingRole.SERVER,
      title: $t('admin.storage_template_settings'),
      icon: mdiHarddisk,
    },
    {
      name: 'backup',
      component: OnboardingBackup,
      role: OnboardingRole.SERVER,
      title: $t('admin.backup_onboarding_title'),
      icon: mdiCloudCheckOutline,
    },
    {
      name: 'mobile_app',
      component: OnboardingMobileApp,
      role: OnboardingRole.USER,
      title: $t('mobile_app'),
      icon: mdiCellphoneArrowDownVariant,
    },
  ]);

  const index = $derived.by(() => {
    const stepState = page.url.searchParams.get('step');
    const temporaryIndex = onboardingSteps.findIndex((step) => step.name === stepState);
    return temporaryIndex === -1 ? 0 : temporaryIndex;
  });
  let userRole = $derived(
    $user.isAdmin && !serverConfigManager.value.isOnboarded ? OnboardingRole.SERVER : OnboardingRole.USER,
  );

  let onboardingStepCount = $derived(onboardingSteps.filter((step) => shouldRunStep(step.role, userRole)).length);
  let onboardingProgress = $derived(
    onboardingSteps.filter((step, i) => shouldRunStep(step.role, userRole) && i <= index).length - 1,
  );

  const shouldRunStep = (stepRole: OnboardingRole, userRole: OnboardingRole) => {
    return (
      stepRole === OnboardingRole.USER ||
      (stepRole === OnboardingRole.SERVER &&
        userRole === OnboardingRole.SERVER &&
        !serverConfigManager.value.isOnboarded)
    );
  };

  const previousStepIndex = $derived(
    onboardingSteps.findLastIndex((step, i) => shouldRunStep(step.role, userRole) && i < index),
  );

  const nextStepIndex = $derived(
    onboardingSteps.findIndex((step, i) => shouldRunStep(step.role, userRole) && i > index),
  );

  const handleNextClicked = async () => {
    if (nextStepIndex == -1) {
      if ($user.isAdmin) {
        await updateAdminOnboarding({ adminOnboardingUpdateDto: { isOnboarded: true } });
        await serverConfigManager.loadServerConfig();
      }

      await setUserOnboarding({
        onboardingDto: { isOnboarded: true },
      });

      await goto(AppRoute.PHOTOS);
    } else {
      await goto(
        `${AppRoute.AUTH_ONBOARDING}?${QueryParameter.ONBOARDING_STEP}=${onboardingSteps[nextStepIndex].name}`,
      );
    }
  };

  const handlePrevious = async () => {
    if (previousStepIndex === -1) {
      return;
    }

    await goto(
      `${AppRoute.AUTH_ONBOARDING}?${QueryParameter.ONBOARDING_STEP}=${onboardingSteps[previousStepIndex].name}`,
    );
  };

  const OnboardingStep = $derived(onboardingSteps[index].component);

  onMount(async () => {
    if (userRole === OnboardingRole.SERVER) {
      await systemConfigManager.init();
    }
  });
</script>

<section id="onboarding-page" class="min-w-dvw flex min-h-dvh p-4">
  <div class="flex flex-col w-full">
    <div class=" bg-gray-300 dark:bg-gray-600 rounded-md h-2">
      <div
        class="progress-bar bg-primary h-2 rounded-md transition-all duration-200 ease-out"
        style="width: {(onboardingProgress / onboardingStepCount) * 100}%"
      ></div>
    </div>
    <div class="py-8 flex place-content-center place-items-center m-auto w-[min(100%,800px)]">
      <OnboardingCard
        title={onboardingSteps[index].title}
        icon={onboardingSteps[index].icon}
        onNext={handleNextClicked}
        onPrevious={handlePrevious}
        previousTitle={onboardingSteps[previousStepIndex]?.title}
        nextTitle={onboardingSteps[nextStepIndex]?.title}
      >
        <OnboardingStep />
      </OnboardingCard>
    </div>
  </div>
</section>
