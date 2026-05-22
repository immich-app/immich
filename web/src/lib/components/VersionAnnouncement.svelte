<script lang="ts">
  import OnEvents from '$lib/components/OnEvents.svelte';
  import VersionAnnouncementModal from '$lib/modals/VersionAnnouncementModal.svelte';
  import { user } from '$lib/stores/user.store';
  import type { ReleaseEvent } from '$lib/types';
  import { getReleaseType, semverToName } from '$lib/utils';
  import { modalManager } from '@immich/ui';

  let modal = $state<{
    onClose: Promise<void>;
    close: () => Promise<void>;
  }>();

  const onReleaseEvent = async (release: ReleaseEvent) => {
    if (!release.isAvailable || !$user.isAdmin) {
      return;
    }

    const releaseVersion = semverToName(release.releaseVersion);
    const serverVersion = semverToName(release.serverVersion);
    const type = getReleaseType(release.serverVersion, release.releaseVersion);

    if (type === 'none' || type === 'patch' || localStorage.getItem('appVersion') === releaseVersion) {
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
