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
</UserPageLayout>
