<script lang="ts">
  import { Dashboard } from 'orchestration-ui';
  import { goto } from '$app/navigation';
  import { Route } from '$lib/route';
</script>

<Dashboard
  onNavigate={(target) => {
    if (target === 'backups') goto(Route.backupsRepositories());
    else if (target === 'schedules') goto(Route.backupsSchedules());
    else if (target === 'config') goto(Route.backupsConfig());
  }}
/>
