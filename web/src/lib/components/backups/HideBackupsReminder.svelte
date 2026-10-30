<script lang="ts">
  import { hideBackupsReminder } from '#lib/stores/preferences.store.ts';
  import { Field, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';
</script>

<Field label={$t('admin.backups_hide_reminder')} description={$t('admin.backups_hide_reminder_description')}>
  <Switch bind:checked={$hideBackupsReminder} />
</Field>
