<script lang="ts">
  import { Button, Icon } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
  import { fade } from 'svelte/transition';
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div
      class="bg-gradient-to-r from-immich-primary to-blue-600 dark:from-immich-dark-primary dark:to-blue-400 p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg text-white"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div class="flex-1 text-center sm:text-left">
          <h2 class="text-xl sm:text-2xl font-bold mb-2">PixelUnion Portal</h2>
          <p class="text-white/90 mb-4 text-sm sm:text-base leading-relaxed">
            Manage your account password and two-factor authentication settings in the PixelUnion portal.
          </p>

          <Button
            size="large"
            class="bg-white text-immich-primary hover:bg-white/90 active:bg-white/80 font-semibold shadow-md transition-all duration-200 hover:shadow-lg touch-manipulation w-full sm:w-auto min-h-[48px]"
            onclick={() => window.open('https://portal.pixelunion.eu/account', '_blank')}
          >
            <div class="flex items-center justify-center gap-2">
              <span>Open Portal</span>
              <Icon icon={mdiOpenInNew} size="20" />
            </div>
          </Button>
        </div>
      </div>
    </div>
  </div>
</section>
