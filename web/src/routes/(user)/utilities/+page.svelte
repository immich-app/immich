<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';
  import { mdiContentDuplicate } from '@mdi/js';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute } from '$lib/constants';
  import UtilitiesPageLink from '$lib/components/utilities-page/utilities-page-link.svelte';

  export let data: PageData;
</script>

<UserPageLayout title={data.meta.title}>
  <div class="flex flex-col overflow-hidden rounded-3xl bg-gray-100 dark:bg-immich-dark-gray sm:flex-row">
    <div class="flex flex-col space-y-2 px-4 py-4">
      <UtilitiesPageLink title="Duplicates" routeId={AppRoute.DUPLICATES} icon={mdiContentDuplicate}>
        <p>Duplicates</p>
      </UtilitiesPageLink>
      <Button
        title="Duplicates"
        size="lg"
        color="dark-gray"
        shadow={false}
        rounded="lg"
        disabled={false}
        on:click
        fullwidth={false}
      >
        <a href={AppRoute.DUPLICATES} class="flex inset-y-0 gap-2 text-sm">
          <Icon path={mdiContentDuplicate} size="18" />
          <p>Duplicates</p>
        </a>
      </Button>
    </div>
  </div>

  <br /><br /><br />

  <div class="flex flex-col overflow-hidden rounded-3xl bg-gray-100 dark:bg-immich-dark-gray sm:flex-row">
    <div class="flex flex-col space-y-2 px-4 py-4">
      <Button
        title="Duplicates"
        size="lg"
        color="overlay-primary"
        shadow={false}
        rounded="lg"
        disabled={false}
        on:click
        fullwidth={false}
      >
        <a href={AppRoute.DUPLICATES} class="text-sm">
          <Icon path={mdiContentDuplicate} size="18" />
          <p>Duplicates</p>
        </a>
      </Button>
      <Button
        title="Duplicates"
        size="lg"
        color="dark-gray"
        shadow={false}
        rounded="lg"
        disabled={false}
        on:click
        fullwidth={false}
      >
        <a href={AppRoute.DUPLICATES} class="flex inset-y-0 gap-2 text-sm">
          <Icon path={mdiContentDuplicate} size="18" />
          <p>Duplicates</p>
        </a>
      </Button>
    </div>
  </div>
</UserPageLayout>
