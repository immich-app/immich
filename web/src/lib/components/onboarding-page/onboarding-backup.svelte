<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { Icon, Stack } from '@immich/ui';
  import { mdiAlertCircleOutline } from '@mdi/js';
  import type { Translations } from 'svelte-i18n';

  const messageKeys = [
    'admin.backup_onboarding_3_description',
    'admin.backup_onboarding_2_description',
    'admin.backup_onboarding_1_description',
  ];
</script>

<div class="flex flex-col">
  <Stack gap={2}>
    <div class="flex items-start gap-4 p-6 my-10 bg-gray-100 dark:bg-gray-800/40 rounded-xl border border-gray-700/50">
      <Icon icon={mdiAlertCircleOutline} size="36" class="text-warning flex-shrink-0 mt-0.5" />
      <div class="text-gray-800 dark:text-gray-300 leading-relaxed">
        <FormatMessage key="admin.backup_onboarding_description">
          {#snippet children({ message })}
            <a
              href="https://www.backblaze.com/blog/the-3-2-1-backup-strategy/"
              class="underline"
              target="_blank"
              rel="noreferrer"
            >
              {message}
            </a>
          {/snippet}
        </FormatMessage>
      </div>
    </div>

    <div class="space-y-1">
      <h2 class="mb-6"><FormatMessage key="admin.backup_onboarding_parts_title" /></h2>

      <div class="space-y-6">
        {#each messageKeys as keyString, index (index)}
          <div class="flex items-start gap-6">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
              <span class="text-light text-xl font-semibold">{3 - index}</span>
            </div>
            <div class="leading-relaxed pt-2">
              <FormatMessage key={keyString as Translations} />
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
      <p>
        <FormatMessage key="admin.backup_onboarding_footer">
          {#snippet children({ message })}
            <a
              href="https://immich.app/docs/administration/backup-and-restore/"
              class="underline"
              target="_blank"
              rel="noreferrer"
            >
              {message}
            </a>
          {/snippet}
        </FormatMessage>
      </p>
    </div>
  </Stack>
</div>
