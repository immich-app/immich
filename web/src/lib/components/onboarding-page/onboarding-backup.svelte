<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import FormatBoldMessage from '$lib/components/i18n/format-bold-message.svelte';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import { Heading, HStack, Stack } from '@immich/ui';
  import { mdiAlert } from '@mdi/js';
</script>

<div class="flex flex-col">
  <Stack gap={2}>
    <HStack gap={4}>
      <Icon path={mdiAlert} size="96" class="text-warning" />
      <p class="mb-2">
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
      </p>
    </HStack>

    <p class="text-lg font-semibold">
      <FormatBoldMessage key="admin.backup_onboarding_parts_title"></FormatBoldMessage>
    </p>

    <Stack class="bg-gray-100 dark:bg-gray-800 rounded-xl p-4" gap={4}>
      <HStack gap={6}>
        <Heading tag="h1" size="title" color="primary">3</Heading>
        <FormatMessage key="admin.backup_onboarding_3_description" />
      </HStack>
      <HStack gap={6}>
        <Heading tag="h1" size="title" color="primary">2</Heading>
        <FormatMessage key="admin.backup_onboarding_2_description" />
      </HStack>
      <HStack gap={6} class="ml-2">
        <Heading tag="h1" size="title" color="primary">1</Heading>
        <FormatMessage key="admin.backup_onboarding_1_description" />
      </HStack>
    </Stack>
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
  </Stack>
</div>
