<script lang="ts">
  import { appStoreBadge, fdroidBadge, Modal, ModalBody, playStoreBadge } from '@immich/ui';
  import { t } from 'svelte-i18n';

  /*
  import { getAboutInfo, type ServerAboutResponseDto } from '@immich/sdk';
  import { onMount } from 'svelte';

  let info: ServerAboutResponseDto | undefined = $state();
  onMount(async () => {
    info = await getAboutInfo();
  });
  */

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<!-- This whole file is based on ServerAboutModal. -->

<Modal title={$t('download')} size="large" {onClose}>
  <ModalBody>
    <div class="flex flex-col sm:grid sm:grid-cols-2 gap-5 text-immich-primary dark:text-immich-dark-primary">
      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="fdroid-link"
          >F-Droid</label
        >
        <p class="immich-form-label pb-2 text-sm" id="fdroid-link">
          <a href="https://f-droid.org/packages/app.alextran.immich/" target="_blank"
            ><img class="pt-2 pr-10" alt="Get it on F-Droid" src={fdroidBadge} /></a
          >
        </p>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="play-store-link"
          >Google Play</label
        >
        <p class="immich-form-label pb-2 text-sm" id="play-store-link">
          <a href="https://play.google.com/store/apps/details?id=app.alextran.immich" target="_blank"
            ><img alt="Get it on Google Play" src={playStoreBadge} /></a
          >
        </p>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="app-store-link"
          >App Store</label
        >
        <p class="immich-form-label pb-2 text-sm" id="app-store-link">
          <a href="https://apps.apple.com/us/app/immich/id1613945652" target="_blank"
            ><img class="pt-2 pr-5" alt="Download on the App Store" src={appStoreBadge} width="90%" /></a
          >
        </p>
      </div>

      <!--
      <div class="col-span-2">
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="imagemagick-desc"
          >Wide</label
        >
        <p class="immich-form-label pb-2 text-sm" id="imagemagick-desc">
          <a href="https://f-droid.org/packages/app.alextran.immich/" target="_blank"
            ><img alt="Add to F-Droid" src={fdroidBadge} /></a
          >
        </p>
      </div>
      -->
    </div>
  </ModalBody>
</Modal>
