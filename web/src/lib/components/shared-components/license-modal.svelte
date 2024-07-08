<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { type ServerAboutResponseDto } from '@immich/sdk';
  import { mdiAccount, mdiCheckCircleOutline, mdiServer } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let onClose: () => void;
</script>

<Portal>
  <FullScreenModal showLogo title={''} {onClose} width="auto">
    <h1 class="text-4xl font-bold text-immich-primary tracking-wider">LICENSE</h1>
    <section class="flex gap-6 mt-4">
      <!-- SERVER LICENSE -->
      <div class="border border-gray-300 w-[300px] p-8 rounded-3xl bg-gray-100">
        <div>
          <Icon path={mdiServer} size="56" class="text-immich-primary" />
          <p class="text-immich-primary font-semibold text-lg mt-1">Server License</p>
        </div>

        <div class="mt-8">
          <p class="text-6xl font-bold">$99<span class="text-2xl font-medium">.99</span></p>
          <p>per server</p>
        </div>

        <div class="mt-6 flex flex-col gap-1">
          <div class="grid grid-cols-[36px_auto]">
            <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
            <p class="self-center">1 license per server</p>
          </div>

          <div class="grid grid-cols-[36px_auto]">
            <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
            <p class="self-center">License for all users on the server</p>
          </div>

          <div class="grid grid-cols-[36px_auto]">
            <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
            <p class="self-center">Lifetime license</p>
          </div>
        </div>
      </div>

      <!-- USER LICENSE -->
      <div class="border border-gray-300 w-[300px] p-8 rounded-3xl bg-gray-100">
        <div>
          <Icon path={mdiAccount} size="56" class="text-immich-primary" />
          <p class="text-immich-primary font-semibold text-lg mt-1">User License</p>
        </div>

        <div class="mt-8">
          <p class="text-6xl font-bold">$25<span class="text-2xl font-medium">.99</span></p>
          <p>per user</p>
        </div>

        <div class="mt-6 flex flex-col gap-1">
          <div class="grid grid-cols-[36px_auto]">
            <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
            <p class="self-center">1 license per user on any server</p>
          </div>

          <div class="grid grid-cols-[36px_auto]">
            <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
            <p class="self-center">Lifetime license</p>
          </div>
        </div>
      </div>
    </section>
  </FullScreenModal>
</Portal>
