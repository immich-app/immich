<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import { t } from 'svelte-i18n';
</script>

Apply the current
<a href="{AppRoute.ADMIN_SETTINGS}?open=storageTemplate" class="text-immich-primary dark:text-immich-dark-primary"
  >{$t('storage_template')}</a
>
to previously uploaded assets
