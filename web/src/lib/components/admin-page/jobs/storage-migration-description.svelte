<script lang="ts">
  import { AppRoute, OpenSettingQueryParameterValue, QueryParameter } from '$lib/constants';
  import { t } from 'svelte-i18n';
</script>

Apply the current
<a
  href="{AppRoute.ADMIN_SETTINGS}?{QueryParameter.IS_OPEN}={OpenSettingQueryParameterValue.STORAGE_TEMPLATE}"
  class="text-immich-primary dark:text-immich-dark-primary"
>
  {$t('admin.storage_template_settings')}
</a>
to previously uploaded assets
