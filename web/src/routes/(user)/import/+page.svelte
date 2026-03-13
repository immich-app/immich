<script lang="ts">
  import ImportWizard from '$lib/components/import/import-wizard.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<UserPageLayout title={data.meta.title}>
  <ImportWizard />
</UserPageLayout>
