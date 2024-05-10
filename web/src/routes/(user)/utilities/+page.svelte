<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';
  import {
    mdiContentDuplicate
  } from '@mdi/js';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute } from '$lib/constants';

  export let data: PageData;
</script>

<UserPageLayout title={data.meta.title}>
  <section class="bg-gray-200 rounded my-10 mx-10">
    <div class="flex flex-col space-y-2 px-4 py-4">
      <Button title="Duplicates" size="lg" color="overlay-primary" shadow={false} rounded="lg" disabled={false} on:click fullwidth={false}>
        <a href="{AppRoute.DUPLICATES}" class="text-sm">
          <Icon path={mdiContentDuplicate} size="18" />
          <p>
            Duplicates
          </p>
        </a>
      </Button>
      <Button title="Duplicates" size="lg" color="dark-gray" shadow={false} rounded="lg" disabled={false} on:click fullwidth={false}>
        <a href="{AppRoute.DUPLICATES}" class="flex inset-y-0 gap-2 text-sm">
          <Icon path={mdiContentDuplicate} size="18" />
          <p>
            Duplicates
          </p>
        </a>
      </Button>
    </div>
  </section>

<div class="bg-gray-200 rounded overflow-hidden shadow-sm my-10 mx-10">
  <div class="flex flex-col space-y-2 px-4 py-4">
    <button type="button" class="flex items-center px-4 py-2 space-x-2 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
      <span class="material-icons text-indigo-500">home</span>
      <span>Home</span>
    </button>
    <button type="button" class="flex items-center px-4 py-2 space-x-2 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
      <span class="material-icons text-indigo-500">settings</span>
      <span>Settings</span>
    </button>
    <button type="button" class="flex items-center px-4 py-2 space-x-2 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
      <span class="material-icons text-indigo-500">account</span>
      <span>Profile</span>
    </button>
  </div>
</div>
<div
  class="flex flex-col overflow-hidden rounded-2xl bg-gray-100 dark:bg-immich-dark-gray sm:flex-row sm:rounded-[35px]"
>
  <div class="flex w-full flex-col">
    <div class="flex flex-col gap-2 p-5 sm:p-7 md:p-9">
      <div class="flex items-center gap-4 text-xl font-semibold text-immich-primary dark:text-immich-dark-primary">
        <span class="flex items-center gap-2">
          title and icon
        </span>
      </div>

        <div class="whitespace-pre-line text-sm dark:text-white"><p>blah subtitle</p></div>

        <div class="text-sm dark:text-white">
          <p>description</p>
        </div>

      <div class="mt-2 flex w-full max-w-md flex-col sm:flex-row">
        <div
          class="rounded-t-lg bg-immich-primary text-white dark:bg-immich-dark-primary dark:text-immich-dark-gray sm:rounded-l-lg sm:rounded-r-none"
        >
          <p>Active</p>
          <p class="text-2xl">
            1
          </p>
        </div>

        <div
          class="flex-row-reverse rounded-b-lg bg-gray-200 text-immich-dark-bg dark:bg-gray-700 dark:text-immich-gray sm:rounded-l-none sm:rounded-r-lg"
        >
          <p class="text-2xl">
            {waitingCount.toLocaleString($locale)}
          </p>
          <p>Waiting</p>
        </div>
      </div>
    </div>
  </div>
  <div class="flex w-full flex-row overflow-hidden sm:w-32 sm:flex-col">
  </div>
</div>
</UserPageLayout>
