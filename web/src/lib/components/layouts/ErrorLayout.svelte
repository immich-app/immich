<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { copyToClipboard } from '$lib/utils';
  import { mdiCodeTags, mdiContentCopy, mdiMessage, mdiPartyPopper } from '@mdi/js';
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

<div class="h-screen w-screen">
  <section class="bg-immich-bg dark:bg-immich-dark-bg">
    <div class="flex place-items-center border-b px-6 py-4 dark:border-b-immich-dark-gray">
      <a class="flex place-items-center gap-2 hover:cursor-pointer" href="/photos">
        <ImmichLogo width="55%" />
      </a>
    </div>
  </section>

  <div class="fixed top-0 flex h-full w-full place-content-center place-items-center overflow-hidden bg-black/50">
    <div>
      <div
        class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
      >
        <div>
          <div class="flex items-center justify-between gap-4 px-4 py-4">
            <h1 class="font-medium text-immich-primary dark:text-immich-dark-primary">
              🚨 {$t('error_title')}
            </h1>
            <div class="flex justify-end">
              <CircleIconButton
                color="primary"
                icon={mdiContentCopy}
                title={$t('copy_error')}
                onclick={() => handleCopy()}
              />
            </div>
          </div>

          <hr />

          <div class="immich-scrollbar max-h-[75vh] min-h-[300px] gap-4 overflow-y-auto p-4 pb-4">
            <div class="flex w-full flex-col gap-2">
              <p class="text-red-500">{error?.message} ({error?.code})</p>
              {#if error?.stack}
                <label for="stacktrace">{$t('stacktrace')}</label>
                <pre id="stacktrace" class="text-xs">{error?.stack || 'No stack'}</pre>
              {/if}
            </div>
          </div>

          <hr />

          <div class="flex place-content-center place-items-center justify-around">
            <!-- href="https://github.com/immich-app/immich/issues/new" -->
            <a
              href="https://discord.immich.app"
              target="_blank"
              rel="noopener noreferrer"
              class="flex grow basis-0 justify-center p-4"
            >
              <div class="flex flex-col place-content-center place-items-center gap-2">
                <Icon path={mdiMessage} size={24} />
                <p class="text-sm">{$t('get_help')}</p>
              </div>
            </a>

            <a
              href="https://github.com/immich-app/immich/releases"
              target="_blank"
              rel="noopener noreferrer"
              class="flex grow basis-0 justify-center p-4"
            >
              <div class="flex flex-col place-content-center place-items-center gap-2">
                <Icon path={mdiPartyPopper} size={24} />
                <p class="text-sm">{$t('read_changelog')}</p>
              </div>
            </a>

            <a
              href="https://immich.app/docs/guides/docker-help"
              target="_blank"
              rel="noopener noreferrer"
              class="flex grow basis-0 justify-center p-4"
            >
              <div class="flex flex-col place-content-center place-items-center gap-2">
                <Icon path={mdiCodeTags} size={24} />
                <p class="text-sm">{$t('check_logs')}</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
