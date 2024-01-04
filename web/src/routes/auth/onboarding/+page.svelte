<script lang="ts">
  import OnboardingHello from '$lib/components/onboarding-page/onboarding-hello.svelte';
  import OnboardingTheme from '$lib/components/onboarding-page/onboarding-theme.svelte';
  import OnboadingStorageTemplate from '$lib/components/onboarding-page/onboarding-storage-template.svelte';
  import { api } from '@api';
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { page } from '$app/stores';

  let index = 0;

  interface OnboardingStep {
    name: string;
    component: typeof OnboardingHello | typeof OnboardingTheme | typeof OnboadingStorageTemplate;
  }

  let onboardingSteps: OnboardingStep[] = [
    { name: 'hello', component: OnboardingHello },
    { name: 'theme', component: OnboardingTheme },
    { name: 'storage', component: OnboadingStorageTemplate },
  ];

  $: {
    const stepState = $page.url.searchParams.get('step');
    const tempIndex = onboardingSteps.findIndex((step) => step.name === stepState);
    index = tempIndex >= 0 ? tempIndex : 0;
  }

  const handleDoneClicked = async () => {
    if (index >= onboardingSteps.length - 1) {
      await api.serverInfoApi.setAdminOnboarding();
      goto(AppRoute.PHOTOS);
    } else {
      index++;
      goto(`${AppRoute.AUTH_ONBOARDING}?step=${onboardingSteps[index].name}`);
    }
  };
</script>

<section id="onboarding-page" class="min-w-screen flex min-h-screen place-content-center place-items-center p-4">
  <svelte:component this={onboardingSteps[index].component} on:done={handleDoneClicked} />
</section>
