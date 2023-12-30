<script>
  import OnboardingCard from './onboarding-card.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import settingUrl from '$lib/assets/settings-outline.svg';
  import { mdiArrowRight } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
</script>

<OnboardingCard>
  <div class="flex place-items-center place-content-center">
    <img src={settingUrl} alt="settings-outline" width="300" />
  </div>
  <p class="dark:text-gray-100 font-semibold text-2xl pb-6">Hello Admin</p>
  <p class="dark:text-gray-100 text-xl pb-6">
    Welcome to Immich! Let's get your instance setup with some common settings
  </p>

  <div class="w-full flex place-content-end">
    <Button class="flex gap-2 place-content-center">
      <p>Theme</p>
      <Icon path={mdiArrowRight} size="18" />
    </Button>
  </div>
</OnboardingCard>
