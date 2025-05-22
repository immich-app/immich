<script lang="ts">
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import { Button, Heading } from '@immich/ui';
  import { t } from 'svelte-i18n';
</script>

<AuthPageLayout>
  <div class="flex flex-col place-items-center text-center gap-12">
    <Heading size="large" color="primary" tag="h1">{$t('welcome_to_immich')}</Heading>
    <div>
      <Button href={AppRoute.AUTH_REGISTER} size="medium" shape="round">
        <span class="px-2 font-semibold">{$t('getting_started')}</span>
      </Button>
    </div>
  </div>
</AuthPageLayout>
