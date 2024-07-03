<script lang="ts">
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import { AppRoute, OpenSettingQueryParameterValue, QueryParameter } from '$lib/constants';
  import { t } from 'svelte-i18n';
</script>

<FormatMessage
  key="admin.storage_template_migration_description"
  values={{ template: $t('admin.storage_template_settings') }}
  let:message
>
  <a
    href="{AppRoute.ADMIN_SETTINGS}?{QueryParameter.IS_OPEN}={OpenSettingQueryParameterValue.STORAGE_TEMPLATE}"
    class="text-immich-primary dark:text-immich-dark-primary"
  >
    {message}
  </a>
</FormatMessage>
