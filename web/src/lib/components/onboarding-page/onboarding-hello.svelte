<script lang="ts">
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import { user } from '$lib/stores/user.store';
  import { Button } from '@immich/ui';
  import { mdiArrowRight } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import OnboardingCard from './onboarding-card.svelte';

  interface Props {
    onDone: () => void;
  }

  let { onDone }: Props = $props();
</script>

<OnboardingCard>
  <ImmichLogo noText class="h-[50px]" />
  <p class="font-medium text-6xl my-6 text-immich-primary dark:text-immich-dark-primary">
    {$t('onboarding_welcome_user', { values: { user: $user.name } })}
  </p>
  <p class="text-3xl pb-6 font-light">{$t('onboarding_welcome_description')}</p>

  <div class="w-full flex place-content-end">
    <Button shape="round" trailingIcon={mdiArrowRight} class="flex gap-2 place-content-center" onclick={onDone}>
      <p>{$t('theme')}</p>
    </Button>
  </div>
</OnboardingCard>
