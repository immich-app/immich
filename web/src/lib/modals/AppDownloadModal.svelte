<script lang="ts">
  import { appStoreBadge, BasicModal, fdroidBadge, playStoreBadge } from '@immich/ui';
  import { t } from 'svelte-i18n';
  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();
</script>

<BasicModal title={$t('app_download_links')} size="tiny" {onClose}>
  <div class="flex flex-col gap-4 max-w-50 mx-auto">
    <a href="https://play.google.com/store/apps/details?id=app.alextran.immich" target="_blank" id="play-store-link">
      <img class="w-full mt-2" alt="Get it on Google Play" src={playStoreBadge} />
    </a>

    <a href="https://apps.apple.com/us/app/immich/id1613945652" target="_blank" id="app-store-link">
      <img class="w-full mt-2" alt="Download on the App Store" src={appStoreBadge} />
    </a>

    <a href="https://f-droid.org/packages/app.alextran.immich/" target="_blank" id="fdroid-link">
      <img class="w-full mt-2" alt="Get it on F-Droid" src={fdroidBadge} />
    </a>
  </div>
</BasicModal>
