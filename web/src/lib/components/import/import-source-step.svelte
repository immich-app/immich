<script lang="ts">
  import { Button, Icon } from '@immich/ui';
  import { mdiApple, mdiArrowRight, mdiGoogle, mdiInformationOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onNext: () => void;
  }

  let { onNext }: Props = $props();
</script>

<div class="flex flex-col gap-6">
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <!-- Google Photos card -->
    <button
      type="button"
      data-testid="source-google"
      class="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-primary bg-primary/5 p-6 text-left transition-colors"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Icon icon={mdiGoogle} size="24" color="primary" />
      </div>
      <div>
        <p class="font-medium">{$t('import_from_google_photos')}</p>
        <p class="text-sm text-gray-500">{$t('import_request_takeout')}</p>
      </div>
    </button>

    <!-- Apple Photos card -->
    <div
      data-testid="source-apple"
      aria-disabled="true"
      class="flex cursor-not-allowed items-center gap-4 rounded-xl border-2 border-gray-200 p-6 opacity-50 dark:border-gray-700"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Icon icon={mdiApple} size="24" />
      </div>
      <div>
        <p class="font-medium">{$t('import_from_apple_photos')}</p>
        <p class="text-sm text-gray-500">{$t('import_coming_soon')}</p>
      </div>
    </div>
  </div>

  <!-- Takeout info -->
  <div class="flex items-start gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
    <Icon icon={mdiInformationOutline} size="20" class="mt-0.5 shrink-0 text-blue-600" />
    <div class="text-sm">
      <p>
        {$t('import_takeout_info')}
        <a
          href="https://takeout.google.com"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-primary underline"
        >
          takeout.google.com
        </a>
      </p>
    </div>
  </div>

  <!-- Next button -->
  <div class="flex justify-end">
    <Button onclick={onNext} trailingIcon={mdiArrowRight}>
      {$t('next')}
    </Button>
  </div>
</div>
