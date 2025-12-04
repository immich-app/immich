<script lang="ts">
  import { AppRoute, OpenSettingQueryParameterValue, QueryParameter } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { t } from 'svelte-i18n';
</script>

<FormatMessage
  key="admin.storage_template_migration_description"
  values={{ template: $t('admin.storage_template_settings') }}
>
  {#snippet children({ message })}
    <a
      href="{AppRoute.ADMIN_SETTINGS}?{QueryParameter.IS_OPEN}={OpenSettingQueryParameterValue.STORAGE_TEMPLATE}"
      class="text-primary"
    >
      {message}
    </a>
  {/snippet}
</FormatMessage>
