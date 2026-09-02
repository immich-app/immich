<script lang="ts">
  import { appStoreBadge, BasicModal, Constants, fdroidBadge, playStoreBadge } from '@immich/ui';
  import { t } from 'svelte-i18n';
  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();
</script>

<BasicModal title={$t('app_download_links')} size="tiny" {onClose}>
  <div class="mx-auto flex max-w-50 flex-col gap-4">
    <a href={Constants.Get.Android} target="_blank" id="play-store-link">
      <img class="mt-2 w-full" alt="Get it on Google Play" src={playStoreBadge} />
    </a>

    <a href={Constants.Get.iOS} target="_blank" id="app-store-link">
      <img class="mt-2 w-full" alt="Download on the App Store" src={appStoreBadge} />
    </a>

    <a href={Constants.Get.FDroid} target="_blank" id="fdroid-link">
      <img class="mt-2 w-full" alt="Get it on F-Droid" src={fdroidBadge} />
    </a>
  </div>
</BasicModal>
