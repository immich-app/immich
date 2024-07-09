<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { getActivationKey } from '$lib/utils/license-utils';
  import { setServerLicense, setUserLicense, type LicenseResponseDto } from '@immich/sdk';

  let licenseKey = '';

  const activate = async () => {
    let response: LicenseResponseDto;

    const isServerKey = licenseKey.search('IMSV') !== -1;
    const activationKey = await getActivationKey(licenseKey);

    if (isServerKey) {
      response = await setServerLicense({ licenseKeyDto: { licenseKey, activationKey } });
    } else {
      response = await setUserLicense({ licenseKeyDto: { licenseKey, activationKey } });
    }

    console.log(response);
  };
</script>

<p class="dark:text-immich-gray">Have a license? Enter the key below</p>
<div class="mt-2 flex gap-2">
  <input
    class="immich-form-input w-full"
    id="licensekey"
    type="text"
    bind:value={licenseKey}
    required
    placeholder="IMCL-KEEY-CCAN-BBEE-FOUD-FROM-YOUR-EMAIL-INBX"
  />
  <Button type="button" rounded="lg" on:click={activate}>Activate</Button>
</div>
