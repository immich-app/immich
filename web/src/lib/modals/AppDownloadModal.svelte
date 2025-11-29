<script lang="ts">
  import { appStoreBadge, fdroidBadge, Modal, ModalBody, playStoreBadge, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();
</script>

<Modal title={$t('app_download_links')} size="large" {onClose}>
  <ModalBody>
    <div class="sm:grid sm:grid-cols-2 gap-5">
      <div class="flex flex-col place-items-start">
        <Text>Google Play</Text>
        <a
          href="https://play.google.com/store/apps/details?id=app.alextran.immich"
          target="_blank"
          id="play-store-link"
        >
          <img class="w-50 mt-2" alt="Get it on Google Play" src={playStoreBadge} />
        </a>
      </div>

      <div class="flex flex-col place-items-start">
        <Text>App Store</Text>
        <a href="https://apps.apple.com/us/app/immich/id1613945652" target="_blank" id="app-store-link">
          <img class="w-50 mt-2" alt="Download on the App Store" src={appStoreBadge} />
        </a>
      </div>

      <div class="flex flex-col place-items-start">
        <Text>F-Droid</Text>
        <a href="https://f-droid.org/packages/app.alextran.immich/" target="_blank" id="fdroid-link">
          <img class="w-50 mt-2" alt="Get it on F-Droid" src={fdroidBadge} />
        </a>
      </div>
    </div>
  </ModalBody>
</Modal>
