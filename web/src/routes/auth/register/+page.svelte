<script lang="ts">
  import AdminRegistrationForm from '$lib/components/forms/admin-registration-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import { Card, CardBody, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<FullscreenContainer title={data.meta.title}>
  <Card variant="subtle" color="secondary">
    <CardBody>
      <Text>{$t('admin.registration_description')}</Text>
    </CardBody>
  </Card>
  <AdminRegistrationForm />
</FullscreenContainer>
