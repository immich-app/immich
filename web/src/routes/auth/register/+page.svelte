<script lang="ts">
  import AdminRegistrationForm from '$lib/components/forms/admin-registration-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import type { PageData } from './$types';
  import { t } from 'svelte-i18n';

  export let data: PageData;
</script>

<FullscreenContainer title={data.meta.title}>
  <p slot="message">
    {$t('admin.registration_description')}
  </p>

  <AdminRegistrationForm />
</FullscreenContainer>
