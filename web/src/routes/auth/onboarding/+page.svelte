<script lang="ts">
  import OnboardingHello from '$lib/components/onboarding-page/onboarding-hello.svelte';
  import OnboardingTheme from '$lib/components/onboarding-page/onboarding-theme.svelte';
  import OnboadingStorageTemplate from '$lib/components/onboarding-page/onboarding-storage-template.svelte';
  import { api } from '@api';
  import { user } from '$lib/stores/user.store';
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';

  let index = 0;

  let onboardingSteps = [OnboardingHello, OnboardingTheme, OnboadingStorageTemplate];

  const handleDoneClicked = async () => {
    index++;

    if (index >= onboardingSteps.length) {
      const { data } = await api.serverInfoApi.setAdminOnboarding();
      console.log('onboarding ', data);
      // goto(AppRoute.PHOTOS);
    }
  };
</script>

<section id="onboarding-page" class="min-w-screen flex min-h-screen place-content-center place-items-center p-4">
  <svelte:component this={onboardingSteps[index]} on:done={handleDoneClicked} />
</section>
