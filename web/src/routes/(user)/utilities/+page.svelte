<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';
  import {
    mdiContentDuplicate
  } from '@mdi/js';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';

  export let data: PageData;
</script>

<UserPageLayout title={data.meta.title}>
  <section>
    <LinkButton href="./duplicates">
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiContentDuplicate} size="18" />
      </div>
    </LinkButton>
  </section>
</UserPageLayout>
