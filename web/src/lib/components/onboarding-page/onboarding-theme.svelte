<script lang="ts">
  import { mdiArrowRight } from '@mdi/js';
  import Button from '../elements/buttons/button.svelte';
  import Icon from '../elements/icon.svelte';
  import OnboardingCard from './onboarding-card.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    done: void;
  }>();
</script>

<OnboardingCard>
  <p>Theme</p>

  <div class="w-full flex place-content-end">
    <Button class="flex gap-2 place-content-center" on:click={() => dispatch('done')}>
      <p>Theme</p>
      <Icon path={mdiArrowRight} size="18" />
    </Button>
  </div>
</OnboardingCard>
