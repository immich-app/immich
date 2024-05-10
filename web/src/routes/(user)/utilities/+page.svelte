<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';

  export let data: PageData;
</script>

<UserPageLayout title={data.meta.title}>
  <section>
    <LinkButton on:click={() => }>
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiContentCopy} size="18" />
      </div>
    </LinkButton>
  </section>
</UserPageLayout>
