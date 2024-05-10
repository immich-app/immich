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
  <section>
    <Button title="Duplicates" size="base" color="transparent-primary" shadow={false} rounded="lg" disabled={false} on:click fullwidth={false}>
      <a href="{AppRoute.DUPLICATES}">
        <div class="flex place-items-center gap-2 text-sm">
          <Icon path={mdiContentDuplicate} size="18" />
          <p>
            Duplicates
          </p>
        </div>
      </a>
    </Button>
    <Button title="Duplicates" size="base" color="dark-gray" shadow={false} rounded="lg" disabled={false} on:click fullwidth={false}>
      <a href="{AppRoute.DUPLICATES}" class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiContentDuplicate} size="18" />
        <p>
          Duplicates
        </p>
      </a>
    </Button>
  </section>
</UserPageLayout>
