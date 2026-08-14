<script lang="ts">
  import { OpenQueryParam } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { Route } from '$lib/route';
  import { t } from 'svelte-i18n';
</script>

<FormatMessage
  key="admin.storage_template_migration_description"
  values={{ template: $t('admin.storage_template_settings') }}
>
  {#snippet children({ message })}
    <a href={Route.systemSettings({ isOpen: OpenQueryParam.STORAGE_TEMPLATE })} class="text-primary">
      {message}
    </a>
  {/snippet}
</FormatMessage>
