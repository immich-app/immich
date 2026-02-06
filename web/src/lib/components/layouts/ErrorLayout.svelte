<script lang="ts">
  import { copyToClipboard } from '$lib/utils';
  import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardTitle,
    Icon,
    IconButton,
    Link,
    Logo,
    Text,
  } from '@immich/ui';
  import { mdiAlarmLight, mdiContentCopy } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    error?: { message: string; code?: string | number; stack?: string } | undefined | null;
  }

  let { error = undefined }: Props = $props();

  const handleCopy = async () => {
    if (!error) {
      return;
    }

    await copyToClipboard(`${error.message} - ${error.code}\n${error.stack}`);
  };
</script>

<div class="flex flex-col h-dvh w-dvw">
  <section>
    <div class="flex place-items-center border-b px-6 py-4 dark:border-b-immich-dark-gray">
      <Link href="/">
        <Logo variant="inline" />
      </Link>
    </div>
  </section>

  <div class="flex flex-1 w-full place-content-center place-items-center overflow-hidden bg-black/30">
    <div class="max-w-[95vw]">
      <Card color="secondary">
        <CardHeader class="flex-row justify-between gap-12">
          <CardTitle tag="h1" size="medium" class="text-primary flex place-items-center gap-4">
            <Icon icon={mdiAlarmLight} color="red" size="32" />
            {$t('error_title')}
          </CardTitle>
          <IconButton
            shape="round"
            color="primary"
            icon={mdiContentCopy}
            aria-label={$t('copy_error')}
            onclick={handleCopy}
          />
        </CardHeader>

        <CardBody class="flex flex-col gap-2">
          <Text color="danger">{error?.message} (HTTP {error?.code})</Text>
          {#if error?.stack}
            <label for="stacktrace">{$t('stacktrace')}</label>
            <pre id="stacktrace" class="text-xs">{error.stack}</pre>
          {/if}
        </CardBody>

        <CardFooter class="items-start">
          <Text size="small" class="text-center">{$t('check_logs')}</Text>
        </CardFooter>
      </Card>
    </div>
  </div>
</div>
