<script lang="ts">
  import StorageTemplateSettings from '$lib/components/admin-settings/StorageTemplateSettings.svelte';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { user } from '$lib/stores/user.store';
</script>

<div class="flex flex-col">
  <p>
    <FormatMessage key="admin.storage_template_onboarding_description_v2">
      {#snippet children({ message })}
        <a class="underline" href="https://docs.immich.app/administration/storage-template">{message}</a>
      {/snippet}
    </FormatMessage>
  </p>

  {#if $user}
    <StorageTemplateSettings minified duration={0} saveOnClose />
  {/if}
</div>
