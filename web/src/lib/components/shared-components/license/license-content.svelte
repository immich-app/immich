<script>
  import Button from '$lib/components/elements/buttons/button.svelte';
  import LicenseKeyInput from './license-key-input.svelte';
  import ServerLicenseCard from './server-license-card.svelte';
  import UserLicenseCard from './user-license-card.svelte';
</script>

<section class="p-4">
  <div>
    <h1 class="text-4xl font-bold text-immich-primary dark:text-immich-dark-primary tracking-wider">LICENSE</h1>
    <p class="text-lg mt-2">Buy a license to support Immich</p>
  </div>
  <div class="flex gap-6 mt-4 justify-between">
    <ServerLicenseCard />
    <UserLicenseCard />
  </div>

  <div class="mt-6">
    <LicenseKeyInput />
  </div>
</section>
