<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { MaintenanceAction, setMaintenanceMode } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  interface Props {
    disabled?: boolean;
  }

  let { disabled = false }: Props = $props();

  async function start() {
    try {
      await setMaintenanceMode({
        setMaintenanceModeDto: {
          action: MaintenanceAction.Start,
        },
      });
    } catch (error) {
      handleError(error, $t('admin.maintenance_start_error'));
    }
  }
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <div class="ms-4 mt-4 flex items-end gap-4">
      <Button shape="round" type="submit" {disabled} size="small" onclick={start}
        >{$t('admin.maintenance_start')}</Button
      >
    </div>
  </div>
</div>
