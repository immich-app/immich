<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import { Heading, Button, Logo } from '@immich/ui';
  import { t } from 'svelte-i18n';
</script>

<section class="flex h-screen w-screen place-content-center place-items-center">
  <div class="flex max-w-[350px] flex-col place-items-center gap-8 text-center">
    <div class="flex place-content-center place-items-center">
      <Logo variant="logo" class="text-center" size="landing" />
    </div>
    <Heading size="giant" color="primary">{$t('welcome_to_immich')}</Heading>
    <Button href={AppRoute.AUTH_REGISTER} size="giant" shape="round">
      <span class="px-2 font-bold">{$t('getting_started')}</span>
    </Button>
  </div>
</section>
