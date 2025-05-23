<script lang="ts">
  import { run } from 'svelte/legacy';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import OnboardingHello from '$lib/components/onboarding-page/onboarding-hello.svelte';
  import OnboardingPrivacy from '$lib/components/onboarding-page/onboarding-privacy.svelte';
  import OnboardingStorageTemplate from '$lib/components/onboarding-page/onboarding-storage-template.svelte';
  import OnboardingTheme from '$lib/components/onboarding-page/onboarding-theme.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { retrieveServerConfig } from '$lib/stores/server-config.store';
  import { updateAdminOnboarding } from '@immich/sdk';
  import { user } from '$lib/stores/user.store';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { OnboardingRole } from '$lib/models/onboarding-role';

  let index = $state(0);
  let userRole = $derived($user.isAdmin && $serverConfig.isOnboarded ? OnboardingRole.SERVER : OnboardingRole.USER);

  interface OnboardingStep {
    name: string;
    component:
      | typeof OnboardingHello
      | typeof OnboardingTheme
      | typeof OnboardingStorageTemplate
      | typeof OnboardingPrivacy;
    role: OnboardingRole;
  }

  const onboardingSteps: OnboardingStep[] = [
    { name: 'hello', component: OnboardingHello, role: OnboardingRole.USER },
    { name: 'theme', component: OnboardingTheme, role: OnboardingRole.USER },
    { name: 'server-privacy', component: OnboardingPrivacy, role: OnboardingRole.SERVER },
    // { name: 'user-privacy', component: OnboardingPrivacy, role: OnboardingRole.USER },
    { name: 'storage', component: OnboardingStorageTemplate, role: OnboardingRole.SERVER },
  ];

  const shouldRunStep = (stepRole: OnboardingRole, userRole: OnboardingRole) => {
    return stepRole === OnboardingRole.USER || stepRole === userRole;
  };

  let onboardingStepCount = $derived(onboardingSteps.filter((step) => shouldRunStep(step.role, userRole)).length);
  let onboardingProgress = $derived(
    onboardingSteps.filter((step, i) => shouldRunStep(step.role, userRole) && i <= index).length,
  );

  run(() => {
    const stepState = $page.url.searchParams.get('step');
    const temporaryIndex = onboardingSteps.findIndex((step) => step.name === stepState);
    index = temporaryIndex === -1 ? 0 : temporaryIndex;
  });

  const handleDoneClicked = async () => {
    let nextStep = index;
    do {
      nextStep++;
    } while (nextStep < onboardingSteps.length && !shouldRunStep(onboardingSteps[nextStep].role, userRole));

    if (nextStep == onboardingSteps.length) {
      // TODO update user onboarding state
      await updateAdminOnboarding({ adminOnboardingUpdateDto: { isOnboarded: true } });
      await retrieveServerConfig();
      await goto(AppRoute.PHOTOS);
    } else {
      await goto(`${AppRoute.AUTH_ONBOARDING}?${QueryParameter.ONBOARDING_STEP}=${onboardingSteps[nextStep].name}`);
    }
  };

  const handlePrevious = async () => {
    let prevStep = index;
    do {
      prevStep--;
    } while (prevStep > 0 && !shouldRunStep(onboardingSteps[prevStep].role, userRole));

    await goto(`${AppRoute.AUTH_ONBOARDING}?${QueryParameter.ONBOARDING_STEP}=${onboardingSteps[prevStep].name}`);
  };

  const SvelteComponent = $derived(onboardingSteps[index].component);
</script>

<section id="onboarding-page" class="min-w-dvw flex min-h-dvh p-4">
  <div class="flex flex-col w-full">
    <div class=" bg-gray-300 dark:bg-gray-600 rounded-md h-2">
      <div
        class="progress-bar bg-immich-primary dark:bg-immich-dark-primary h-2 rounded-md transition-all duration-200 ease-out"
        style="width: {(onboardingProgress / (onboardingStepCount - 1)) * 100}%"
      ></div>
    </div>
    <div class="py-8 flex place-content-center place-items-center m-auto">
      <SvelteComponent onDone={handleDoneClicked} onPrevious={handlePrevious} />
    </div>
  </div>
</section>
