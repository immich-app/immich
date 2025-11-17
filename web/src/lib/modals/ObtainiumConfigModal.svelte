<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { createApiKey, Permission } from '@immich/sdk';
  import { Button, Modal, ModalBody, obtainiumBadge, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  let inputUrl = $state(location.origin);
  let inputApiKey = $state('');
  let archVariant = $state('');
  let obtainiumLink = $derived(
    `https://apps.obtainium.imranr.dev/redirect?r=obtainium://app/%7B%22id%22%3A%22app.alextran.immich%22%2C%22url%22%3A%22${inputUrl}%2Fapi%2Fserver%2Fapk-links%22%2C%22author%22%3A%22Immich%22%2C%22name%22%3A%22Immich%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22intermediateLink%5C%22%3A%5B%5D%2C%5C%22customLinkFilterRegex%5C%22%3A%5C%22%5C%22%2C%5C%22filterByLinkText%5C%22%3Afalse%2C%5C%22skipSort%5C%22%3Afalse%2C%5C%22reverseSort%5C%22%3Afalse%2C%5C%22sortByLastLinkSegment%5C%22%3Afalse%2C%5C%22versionExtractWholePage%5C%22%3Afalse%2C%5C%22requestHeader%5C%22%3A%5B%7B%5C%22requestHeader%5C%22%3A%5C%22User-Agent%3A%20Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F114.0.0.0%20Mobile%20Safari%2F537.36%5C%22%7D%2C%7B%5C%22requestHeader%5C%22%3A%5C%22x-api-key%3A%20${inputApiKey}%5C%22%7D%5D%2C%5C%22defaultPseudoVersioningMethod%5C%22%3A%5C%22APKLinkHash%5C%22%2C%5C%22trackOnly%5C%22%3Afalse%2C%5C%22versionExtractionRegEx%5C%22%3A%5C%22%2Fv(%5C%5C%5C%5Cd%2B).(%5C%5C%5C%5Cd%2B).(%5C%5C%5C%5Cd%2B)%2F%5C%22%2C%5C%22matchGroupToUse%5C%22%3A%5C%22%241.%242.%243%5C%22%2C%5C%22versionDetection%5C%22%3Atrue%2C%5C%22useVersionCodeAsOSVersion%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22app-${archVariant}.apk%24%5C%22%2C%5C%22invertAPKFilter%5C%22%3Afalse%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%2C%5C%22appName%5C%22%3A%5C%22%5C%22%2C%5C%22appAuthor%5C%22%3A%5C%22%5C%22%2C%5C%22shizukuPretendToBeGooglePlay%5C%22%3Afalse%2C%5C%22allowInsecure%5C%22%3Afalse%2C%5C%22exemptFromBackgroundUpdates%5C%22%3Afalse%2C%5C%22skipUpdateNotifications%5C%22%3Afalse%2C%5C%22about%5C%22%3A%5C%22%5C%22%2C%5C%22refreshBeforeDownload%5C%22%3Afalse%7D%22%2C%22overrideSource%22%3Anull%7D`,
  );
  const handleCreate = async () => {
    try {
      const { secret } = await createApiKey({
        apiKeyCreateDto: {
          name: 'Obtainium',
          permissions: [Permission.ServerApkLinks],
        },
      });
      inputApiKey = secret;
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_api_key'));
    }
  };
  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();
</script>

<Modal title={$t('obtainium_configurator')} size="medium" {onClose}>
  <ModalBody>
    <div>
      <Text color="muted" size="small">
        {$t('obtainium_configurator_instructions')}
      </Text>
      <form class="mt-4">
        <div class="mt-2">
          <SettingInputField inputType={SettingInputFieldType.TEXT} label={$t('url')} bind:value={inputUrl} />
        </div>

        <div class="mt-2 flex gap-2 place-items-center place-content-center">
          <SettingInputField inputType={SettingInputFieldType.TEXT} label={$t('api_key')} bind:value={inputApiKey} />

          <div class="translate-y-[3px]">
            <Button size="small" onclick={() => handleCreate()}>{$t('create_api_key')}</Button>
          </div>
        </div>

        <SettingSelect
          label={$t('app_architecture_variant')}
          bind:value={archVariant}
          options={[
            { value: 'arm64-v8a-release', text: 'arm64-v8a' },
            { value: 'armeabi-v7a-release', text: 'armeabi-v7a' },
            { value: 'release', text: 'universal' },
            { value: 'x86_64-release', text: 'x86_64' },
          ]}
        />
      </form>

      {#if inputUrl && inputApiKey && archVariant}
        <div class="content-center">
          <hr />
          <div class="flex place-items-center place-content-center">
            <a
              href={obtainiumLink}
              class="underline text-sm immich-form-label"
              target="_blank"
              rel="noreferrer"
              id="obtainium-link"
            >
              <img class="pt-2 pr-5 h-20" alt="Get it on Obtainium" src={obtainiumBadge} />
            </a>
          </div>
        </div>
      {/if}
    </div>
  </ModalBody>
</Modal>
