<script lang="ts">
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import VersionAnnouncementModal from '$lib/modals/VersionAnnouncementModal.svelte';
  import { semverToName } from '$lib/utils';
  import { ReleaseType, type ReleaseEventV1 } from '@immich/sdk';
  import { modalManager } from '@immich/ui';

  let modal = $state<{
    onClose: Promise<void>;
    close: () => Promise<void>;
  }>();

  const onReleaseEvent = async (release: ReleaseEventV1) => {
    if (!release.isAvailable || !authManager.user.isAdmin) {
      return;
    }

    const releaseVersion = semverToName(release.releaseVersion);
    const serverVersion = semverToName(release.serverVersion);

    if (
      !release.type ||
      release.type === ReleaseType.Patch ||
      release.type === ReleaseType.Prepatch ||
      localStorage.getItem('appVersion') === releaseVersion
    ) {
      return;
    }

    try {
      await modal?.close();

      modal = modalManager.open(VersionAnnouncementModal, { serverVersion, releaseVersion });

      void modal.onClose.then(() => {
        localStorage.setItem('appVersion', releaseVersion);
      });
    } catch (error) {
      console.error('Error [VersionAnnouncementBox]:', error);
    }
  };
</script>

<OnEvents {onReleaseEvent} />
