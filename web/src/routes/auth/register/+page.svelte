<script lang="ts">
  import AdminRegistrationForm from '$lib/components/forms/admin-registration-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import type { PageData } from './$types';
  import { t } from 'svelte-i18n';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<FullscreenContainer title={data.meta.title}>
  {#snippet message()}
    <p>
      {$t('admin.registration_description')}
    </p>
  {/snippet}

  <AdminRegistrationForm />
</FullscreenContainer>
