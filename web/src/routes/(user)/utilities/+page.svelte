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
  <section class="flex place-items-center gap-2">
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
  </section>

<div class="bg-gray-100 rounded overflow-hidden shadow-sm">
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
</UserPageLayout>
