<script lang="ts">
  import AdminRegistrationForm from '$lib/components/forms/admin-registration-form.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<FullscreenContainer title={data.meta.title}>
  <p slot="message">
    Étant donné que vous êtes le premier utilisateur du système, vous serez désigné comme administrateur 
    et vous serez responsable des tâches administratives. Les utilisateurs supplémentaires seront créés par vous.
  </p>

  <AdminRegistrationForm />
</FullscreenContainer>
