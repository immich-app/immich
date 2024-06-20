<script lang="ts">
  import FormatTags from '$lib/components/i18n/format-tags.svelte';
  import { AppRoute, OpenSettingQueryParameterValue, QueryParameter } from '$lib/constants';
  import { json, t } from 'svelte-i18n';
</script>

<FormatTags
  message={$json('admin.storage_template_migration_description')}
  values={{ template: $t('admin.storage_template_settings') }}
  let:message
>
  <a
    href="{AppRoute.ADMIN_SETTINGS}?{QueryParameter.IS_OPEN}={OpenSettingQueryParameterValue.STORAGE_TEMPLATE}"
    class="text-immich-primary dark:text-immich-dark-primary"
  >
    {message}
  </a>
</FormatTags>
