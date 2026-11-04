<script lang="ts">
  import { hideBackupsReminder } from '$lib/stores/preferences.store';
  import { Field, Switch } from '@immich/ui';
</script>

<Field
  label="Hide backups reminder"
  description="If you already manage backups outside of Immich, you can hide the backup setup reminder."
>
  <Switch bind:checked={$hideBackupsReminder} />
</Field>
