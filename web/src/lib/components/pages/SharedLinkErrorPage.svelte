<script lang="ts">
  import { withTitleSuffix } from '#lib/branding.ts';
  import { t } from 'svelte-i18n';
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{withTitleSuffix($t('error'))}</title>
</svelte:head>

<section class="flex h-dvh w-dvw flex-col place-content-center place-items-center px-4">
  <h1 class="py-10 text-4xl text-primary"><span>{$t('errors.page_not_found')}</span><span class="ps-3">:/</span></h1>
  {#if page.error?.message}
    <h2 class="text-xl text-immich-fg dark:text-immich-dark-fg">{page.error.message}</h2>
  {/if}
</section>
