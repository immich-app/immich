<script lang="ts">
  import AdminRegistrationForm from '$lib/components/forms/admin-registration-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<FullscreenContainer title={data.meta.title}>
  <p slot="message">
    Since you are the first user on the system, you will be assigned as the Admin and are responsible for administrative
    tasks, and additional users will be created by you.
  </p>

  <AdminRegistrationForm />
</FullscreenContainer>
