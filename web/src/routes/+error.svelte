<script>
  import { page } from '$app/stores';
  import Icon from '$lib/components/elements/icon.svelte';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import { mdiCodeTags, mdiContentCopy, mdiMessage, mdiPartyPopper } from '@mdi/js';
  import { copyToClipboard } from '../api/utils';

  const handleCopy = async () => {
    //
    const error = $page.error || null;
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
        <ImmichLogo height="35" width="35" />
        <h1 class="font-immich-title text-2xl text-immich-primary dark:text-immich-dark-primary">IMMICH</h1>
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
              🚨 Error - Something went wrong
            </h1>
            <div class="flex justify-end">
              <button
                on:click={() => handleCopy()}
                class="rounded-full bg-immich-primary px-3 py-2 text-sm text-white shadow-md transition-colors hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-immich-dark-gray dark:hover:bg-immich-dark-primary/80"
              >
                <Icon path={mdiContentCopy} size={24} />
              </button>
            </div>
          </div>

          <hr />

          <div class="immich-scrollbar max-h-[75vh] min-h-[300px] gap-4 overflow-y-auto p-4 pb-4">
            <div class="flex w-full flex-col gap-2">
              <p class="text-red-500">{$page.error?.message} ({$page.error?.code})</p>
              {#if $page.error?.stack}
                <label for="stacktrace">Stacktrace</label>
                <pre id="stacktrace" class="text-xs">{$page.error?.stack || 'No stack'}</pre>
              {/if}
            </div>
          </div>

          <hr />

          <div class="flex place-content-center place-items-center justify-around">
            <!-- href="https://github.com/immich-app/immich/issues/new" -->
            <a
              href="https://discord.com/invite/D8JsnBEuKb"
              target="_blank"
              rel="noopener noreferrer"
              class="flex grow basis-0 justify-center p-4"
            >
              <button class="flex flex-col place-content-center place-items-center gap-2">
                <Icon path={mdiMessage} size={24} />
                <p class="text-sm">Get Help</p>
              </button>
            </a>

            <a
              href="https://github.com/immich-app/immich/releases"
              target="_blank"
              rel="noopener noreferrer"
              class="flex grow basis-0 justify-center p-4"
            >
              <button class="flex flex-col place-content-center place-items-center gap-2">
                <Icon path={mdiPartyPopper} size={24} />
                <p class="text-sm">Read Changelog</p>
              </button>
            </a>

            <a
              href="https://immich.app/docs/guides/docker-help"
              target="_blank"
              rel="noopener noreferrer"
              class="flex grow basis-0 justify-center p-4"
            >
              <button class="flex flex-col place-content-center place-items-center gap-2">
                <Icon path={mdiCodeTags} size={24} />
                <p class="text-sm">Check Logs</p>
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
