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

  let index = $state(0);

  interface OnboardingStep {
    name: string;
    component:
      | typeof OnboardingHello
      | typeof OnboardingTheme
      | typeof OnboardingStorageTemplate
      | typeof OnboardingPrivacy;
  }

  const onboardingSteps: OnboardingStep[] = [
    { name: 'hello', component: OnboardingHello },
    { name: 'theme', component: OnboardingTheme },
    { name: 'privacy', component: OnboardingPrivacy },
    { name: 'storage', component: OnboardingStorageTemplate },
  ];

  run(() => {
    const stepState = $page.url.searchParams.get('step');
    const temporaryIndex = onboardingSteps.findIndex((step) => step.name === stepState);
    index = temporaryIndex === -1 ? 0 : temporaryIndex;
  });

  const handleDoneClicked = async () => {
    if (index >= onboardingSteps.length - 1) {
      await updateAdminOnboarding({ adminOnboardingUpdateDto: { isOnboarded: true } });
      await retrieveServerConfig();
      await goto(AppRoute.PHOTOS);
    } else {
      index++;
      await goto(`${AppRoute.AUTH_ONBOARDING}?${QueryParameter.ONBOARDING_STEP}=${onboardingSteps[index].name}`);
    }
  };

  const handlePrevious = async () => {
    if (index >= 1) {
      index--;
      await goto(`${AppRoute.AUTH_ONBOARDING}?${QueryParameter.ONBOARDING_STEP}=${onboardingSteps[index].name}`);
    }
  };

  const SvelteComponent = $derived(onboardingSteps[index].component);
</script>

<section id="onboarding-page" class="min-w-screen flex min-h-screen p-4">
  <div class="flex flex-col w-full">
    <div class="w-full bg-gray-300 dark:bg-gray-600 rounded-md h-2">
      <div
        class="progress-bar bg-immich-primary dark:bg-immich-dark-primary h-2 rounded-md transition-all duration-200 ease-out"
        style="width: {(index / (onboardingSteps.length - 1)) * 100}%"
      ></div>
    </div>
    <div class="w-full min-w-screen py-8 flex h-full place-content-center place-items-center">
      <SvelteComponent onDone={handleDoneClicked} onPrevious={handlePrevious} />
    </div>
  </div>
</section>
