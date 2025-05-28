<script lang="ts">
  import { getAboutInfo, type ServerAboutResponseDto } from '@immich/sdk';
  import { Modal, ModalBody } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let info: ServerAboutResponseDto | undefined = $state();
  onMount(async () => {
    info = await getAboutInfo();
  });

  const currentURL = location.origin;
  const baseObtainiumConfig = `https://apps.obtainium.imranr.dev/redirect?r=obtainium://app/%7B%22id%22%3A%22app.alextran.immich%22%2C%22url%22%3A%22${currentURL}%2Fapi%2Fserver%2Fandroid-links%22%2C%22author%22%3A%22Immich%22%2C%22name%22%3A%22Immich%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22intermediateLink%5C%22%3A%5B%5D%2C%5C%22customLinkFilterRegex%5C%22%3A%5C%22%5C%22%2C%5C%22filterByLinkText%5C%22%3Afalse%2C%5C%22skipSort%5C%22%3Afalse%2C%5C%22reverseSort%5C%22%3Afalse%2C%5C%22sortByLastLinkSegment%5C%22%3Afalse%2C%5C%22versionExtractWholePage%5C%22%3Afalse%2C%5C%22requestHeader%5C%22%3A%5B%7B%5C%22requestHeader%5C%22%3A%5C%22User-Agent%3A%20Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F114.0.0.0%20Mobile%20Safari%2F537.36%5C%22%7D%2C%7B%5C%22requestHeader%5C%22%3A%5C%22x-api-key%3A%20oX8dy5xYnpkHC7w0rPYQ7J9Gt4VtCMLCww1xHCzZF0o%5C%22%7D%5D%2C%5C%22defaultPseudoVersioningMethod%5C%22%3A%5C%22partialAPKHash%5C%22%2C%5C%22trackOnly%5C%22%3Afalse%2C%5C%22versionExtractionRegEx%5C%22%3A%5C%22%2Fv(%5C%5C%5C%5Cd%2B).(%5C%5C%5C%5Cd%2B).(%5C%5C%5C%5Cd%2B)%2F%5C%22%2C%5C%22matchGroupToUse%5C%22%3A%5C%22%241.%242.%243%5C%22%2C%5C%22versionDetection%5C%22%3Atrue%2C%5C%22useVersionCodeAsOSVersion%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22app-release%5C%22%2C%5C%22invertAPKFilter%5C%22%3Afalse%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%2C%5C%22appName%5C%22%3A%5C%22%5C%22%2C%5C%22appAuthor%5C%22%3A%5C%22%5C%22%2C%5C%22shizukuPretendToBeGooglePlay%5C%22%3Afalse%2C%5C%22allowInsecure%5C%22%3Afalse%2C%5C%22exemptFromBackgroundUpdates%5C%22%3Afalse%2C%5C%22skipUpdateNotifications%5C%22%3Afalse%2C%5C%22about%5C%22%3A%5C%22%5C%22%2C%5C%22refreshBeforeDownload%5C%22%3Afalse%7D%22%2C%22overrideSource%22%3Anull%7D`;

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<Modal title={$t('download')} {onClose}>
  <ModalBody>
    <div class="flex flex-col sm:grid sm:grid-cols-2 gap-1 text-immich-primary dark:text-immich-dark-primary">
      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="version-desc"
          >Immich</label
        >
        <div>
          <a
            href={info?.versionUrl}
            class="underline text-sm immich-form-label"
            target="_blank"
            rel="noreferrer"
            id="version-desc"
          >
            {info?.version}
          </a>
        </div>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="ffmpeg-desc"
          >Obtainium</label
        >
        <div>
          <a
            href={baseObtainiumConfig}
            class="underline text-sm immich-form-label"
            target="_blank"
            rel="noreferrer"
            id="version-desc"
          >
            Obtainium config url
          </a>
        </div>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="nodejs-desc"
          >Node.js</label
        >
        <p class="immich-form-label pb-2 text-sm" id="nodejs-desc">
          {info?.nodejs}
        </p>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="vips-desc"
          >Libvips</label
        >
        <p class="immich-form-label pb-2 text-sm" id="vips-desc">
          {info?.libvips}
        </p>
      </div>

      <div class="col-span-2">
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="imagemagick-desc"
          >F-Droid</label
        >
        <a href="https://f-droid.org/packages/app.alextran.immich/" target="_blank"
          ><img alt="Add to F-Droid" src="https://f-droid.org/badge/get-it-on-en.png" /></a
        >
        <p class="immich-form-label pb-2 text-sm" id="imagemagick-desc">
          {info?.imagemagick}
        </p>
      </div>

      <div class={(info?.ffmpeg?.length || 0) > 10 ? 'col-span-2' : ''}>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="ffmpeg-desc"
          >FFmpeg</label
        >
        <p class="immich-form-label pb-2 text-sm" id="ffmpeg-desc">
          {info?.ffmpeg}
        </p>
      </div>
    </div>
  </ModalBody>
</Modal>
