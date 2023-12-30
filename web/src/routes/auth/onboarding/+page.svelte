<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import AdminRegistrationForm from '$lib/components/forms/admin-registration-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import settingUrl from '$lib/assets/settings-outline.svg';
  import type { PageData } from './$types';
  import { mdiArrowRight } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import OnboardingCard from '$lib/components/onboarding-page/onboarding-card.svelte';
  import OnboardingHello from '$lib/components/onboarding-page/onboarding-hello.svelte';
  import OnboardingTheme from '$lib/components/onboarding-page/onboarding-theme.svelte';
  import OnboadingStorageTemplate from '$lib/components/onboarding-page/onboading-storage-template.svelte';

  export let data: PageData;

  let index = 0;

  let onboardingSteps = [OnboardingHello, OnboardingTheme, OnboadingStorageTemplate];

  const handleDoneClicked = () => {
    index++;

    if (index >= onboardingSteps.length) {
      console.log('Onboarding done');
    }
  };
</script>

<section id="onboarding-page" class="min-w-screen flex min-h-screen place-content-center place-items-center p-4">
  <svelte:component this={onboardingSteps[index]} on:done={handleDoneClicked} />
</section>
