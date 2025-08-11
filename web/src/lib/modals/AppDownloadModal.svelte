<script lang="ts">
  import { appStoreBadge, fdroidBadge, Modal, ModalBody, playStoreBadge } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<Modal title={$t('app_download_links')} size="large" {onClose}>
  <ModalBody
    ><div class="flex flex-col sm:grid sm:grid-cols-2 gap-5 text-immich-primary dark:text-immich-dark-primary">
      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="fdroid-link"
          >F-Droid</label
        >
        <a href="https://f-droid.org/packages/app.alextran.immich/" target="_blank" id="fdroid-link"
          ><img class="pt-2 pr-10" alt="Get it on F-Droid" src={fdroidBadge} /></a
        >
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="play-store-link"
          >Google Play</label
        >
        <a href="https://play.google.com/store/apps/details?id=app.alextran.immich" target="_blank" id="play-store-link"
          ><img alt="Get it on Google Play" src={playStoreBadge} /></a
        >
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="app-store-link"
          >App Store</label
        >
        <a href="https://apps.apple.com/us/app/immich/id1613945652" target="_blank" id="app-store-link"
          ><img class="pt-2 pr-5" alt="Download on the App Store" src={appStoreBadge} width="90%" /></a
        >
      </div>
    </div>
  </ModalBody>
</Modal>
