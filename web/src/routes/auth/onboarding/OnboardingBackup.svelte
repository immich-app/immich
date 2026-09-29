<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { Icon, Link, Stack } from '@immich/ui';
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
    <div class="my-10 flex items-start gap-4 rounded-xl border border-gray-700/50 bg-gray-100 p-6 dark:bg-gray-800/40">
      <Icon icon={mdiAlertCircleOutline} size="36" class="mt-0.5 shrink-0 text-warning" />
      <div class="leading-relaxed text-gray-800 dark:text-gray-300">
        <FormatMessage key="admin.backup_onboarding_description">
          {#snippet children({ message })}
            <Link href="https://www.backblaze.com/blog/the-3-2-1-backup-strategy/">
              {message}
            </Link>
          {/snippet}
        </FormatMessage>
      </div>
    </div>

    <div class="space-y-1">
      <h2 class="mb-6"><FormatMessage key="admin.backup_onboarding_parts_title" /></h2>

      <div class="space-y-6">
        {#each messageKeys as keyString, index (index)}
          <div class="flex items-start gap-6">
            <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/90">
              <span class="text-xl font-semibold text-light">{3 - index}</span>
            </div>
            <div class="pt-2 leading-relaxed">
              <FormatMessage key={keyString as Translations} />
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="mt-4 text-sm/relaxed text-gray-600 dark:text-gray-400">
      <p>
        <FormatMessage key="admin.backup_onboarding_footer">
          {#snippet children({ message })}
            <Link href="https://docs.immich.app/administration/backup-and-restore/">{message}</Link>
          {/snippet}
        </FormatMessage>
      </p>
    </div>
  </Stack>
</div>
