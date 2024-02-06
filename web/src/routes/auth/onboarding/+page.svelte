<script lang="ts">
  import OnboardingHello from '$lib/components/onboarding-page/onboarding-hello.svelte';
  import OnboardingTheme from '$lib/components/onboarding-page/onboarding-theme.svelte';
  import OnboadingStorageTemplate from '$lib/components/onboarding-page/onboarding-storage-template.svelte';
  import { api } from '@api';
  import { goto } from '$app/navigation';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { page } from '$app/stores';

  let index = 0;

  interface OnboardingStep {
    name: string;
    component: typeof OnboardingHello | typeof OnboardingTheme | typeof OnboadingStorageTemplate;
  }

  const onboardingSteps: OnboardingStep[] = [
    { name: 'hello', component: OnboardingHello },
    { name: 'theme', component: OnboardingTheme },
    { name: 'storage', component: OnboadingStorageTemplate },
  ];

  $: {
    const stepState = $page.url.searchParams.get('step');
    const temporaryIndex = onboardingSteps.findIndex((step) => step.name === stepState);
    index = temporaryIndex >= 0 ? temporaryIndex : 0;
  }

  const handleDoneClicked = async () => {
    if (index >= onboardingSteps.length - 1) {
      await api.serverInfoApi.setAdminOnboarding();
      goto(AppRoute.PHOTOS);
    } else {
      index++;
      goto(`${AppRoute.AUTH_ONBOARDING}?${QueryParameter.ONBOARDING_STEP}=${onboardingSteps[index].name}`);
    }
  };

  const handlePrevious = () => {
    if (index >= 1) {
      index--;
      goto(`${AppRoute.AUTH_ONBOARDING}?${QueryParameter.ONBOARDING_STEP}=${onboardingSteps[index].name}`);
    }
  };
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
      <svelte:component
        this={onboardingSteps[index].component}
        on:done={handleDoneClicked}
        on:previous={handlePrevious}
      />
    </div>
  </div>
</section>
