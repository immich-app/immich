<script module lang="ts">
  let visited = false;

  const isFirstVisit = () => {
    const firstVisit = !visited;
    visited = true;
    return firstVisit;
  };
</script>

<script lang="ts">
  import StorageTemplateSettings from '$lib/components/admin-settings/StorageTemplateSettings.svelte';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';

  const preselectDate = isFirstVisit();
</script>

<div class="flex flex-col gap-2">
  <p>
    <FormatMessage key="admin.storage_template_onboarding_description_v3" />
  </p>

  {#if authManager.authenticated}
    <StorageTemplateSettings minified duration={0} saveOnClose {preselectDate} />
  {/if}
</div>
