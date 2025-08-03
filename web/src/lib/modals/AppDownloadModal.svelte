<script lang="ts">
  import { getAboutInfo, type ServerAboutResponseDto } from '@immich/sdk';
  import { appStoreBadge, fdroidBadge, Modal, ModalBody, /* obtainiumBadge, */ playStoreBadge } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let info: ServerAboutResponseDto | undefined = $state();
  onMount(async () => {
    info = await getAboutInfo();
  });

  let inputUrl = $state(location.origin);
  let inputApiKey = $state();
  let archVariant = $state();
  let obtainiumLink = $derived(
    `https://apps.obtainium.imranr.dev/redirect?r=obtainium://app/%7B%22id%22%3A%22app.alextran.immich%22%2C%22url%22%3A%22${inputUrl}%2Fapi%2Fserver%2Fapk-links%22%2C%22author%22%3A%22Immich%22%2C%22name%22%3A%22Immich%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22intermediateLink%5C%22%3A%5B%5D%2C%5C%22customLinkFilterRegex%5C%22%3A%5C%22%5C%22%2C%5C%22filterByLinkText%5C%22%3Afalse%2C%5C%22skipSort%5C%22%3Afalse%2C%5C%22reverseSort%5C%22%3Afalse%2C%5C%22sortByLastLinkSegment%5C%22%3Afalse%2C%5C%22versionExtractWholePage%5C%22%3Afalse%2C%5C%22requestHeader%5C%22%3A%5B%7B%5C%22requestHeader%5C%22%3A%5C%22User-Agent%3A%20Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F114.0.0.0%20Mobile%20Safari%2F537.36%5C%22%7D%2C%7B%5C%22requestHeader%5C%22%3A%5C%22x-api-key%3A%20${inputApiKey}%5C%22%7D%5D%2C%5C%22defaultPseudoVersioningMethod%5C%22%3A%5C%22partialAPKHash%5C%22%2C%5C%22trackOnly%5C%22%3Afalse%2C%5C%22versionExtractionRegEx%5C%22%3A%5C%22%2Fv(%5C%5C%5C%5Cd%2B).(%5C%5C%5C%5Cd%2B).(%5C%5C%5C%5Cd%2B)%2F%5C%22%2C%5C%22matchGroupToUse%5C%22%3A%5C%22%241.%242.%243%5C%22%2C%5C%22versionDetection%5C%22%3Atrue%2C%5C%22useVersionCodeAsOSVersion%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22${archVariant}%24%5C%22%2C%5C%22invertAPKFilter%5C%22%3Afalse%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%2C%5C%22appName%5C%22%3A%5C%22%5C%22%2C%5C%22appAuthor%5C%22%3A%5C%22%5C%22%2C%5C%22shizukuPretendToBeGooglePlay%5C%22%3Afalse%2C%5C%22allowInsecure%5C%22%3Afalse%2C%5C%22exemptFromBackgroundUpdates%5C%22%3Afalse%2C%5C%22skipUpdateNotifications%5C%22%3Afalse%2C%5C%22about%5C%22%3A%5C%22%5C%22%2C%5C%22refreshBeforeDownload%5C%22%3Afalse%7D%22%2C%22overrideSource%22%3Anull%7D`,
  );

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<!-- This whole file is based on ServerAboutModal. -->

<Modal title={$t('download')} {onClose}>
  <ModalBody>
    <div class="flex flex-col sm:grid sm:grid-cols-2 gap-1 text-immich-primary dark:text-immich-dark-primary">
      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="ffmpeg-desc"
          >Obtainium</label
        >
        <div>
          <form>
            <label>
              URL: <input bind:value={inputUrl} placeholder="https://my.immich.app" required />
            </label>
            <br />
            <label>
              API Key: <input bind:value={inputApiKey} placeholder="<immich-api-key>" required />
            </label>
            <p>
              Variant: <label
                ><input
                  type="radio"
                  name="archVariantOption"
                  value="app-arm64-v8a-release"
                  bind:group={archVariant}
                  required
                />
                arm64-v8a
              </label>
              <label>
                <input
                  type="radio"
                  name="archVariantOption"
                  value="app-armeabi-v7a-release"
                  bind:group={archVariant}
                  required
                />
                armeabi-v7a
              </label>
              <label>
                <input type="radio" name="archVariantOption" value="app-release" bind:group={archVariant} required />
                Universal
              </label>
              <label>
                <input
                  type="radio"
                  name="archVariantOption"
                  value="app-x86_64-release"
                  bind:group={archVariant}
                  required
                />
                x86_64
              </label>
            </p>
          </form>
        </div>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="nodejs-desc"></label>
        <p class="immich-form-label pb-2 text-sm" id="fdroid-link">
          <a
            hidden={!(inputUrl && inputApiKey && archVariant)}
            href={obtainiumLink}
            class="underline text-sm immich-form-label"
            target="_blank"
            rel="noreferrer"
            id="version-desc"
            ><img
              class="pt-2 pr-5"
              alt="Get it on Obtainium"
              src="https://raw.githubusercontent.com/ImranR98/Obtainium/refs/heads/main/assets/graphics/badge_obtainium.png"
            />
          </a>
        </p>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="nodejs-desc"
          >F-Droid</label
        >
        <p class="immich-form-label pb-2 text-sm" id="fdroid-link">
          <a href="https://f-droid.org/packages/app.alextran.immich/" target="_blank"
            ><img class="pt-2 pr-10" alt="Get it on F-Droid" src={fdroidBadge} /></a
          >
        </p>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="nodejs-desc"
          >Google Play</label
        >
        <p class="immich-form-label pb-2 text-sm" id="play-store-link">
          <a href="https://play.google.com/store/apps/details?id=app.alextran.immich" target="_blank"
            ><img alt="Get it on Google Play" src={playStoreBadge} /></a
          >
        </p>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="nodejs-desc"
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
