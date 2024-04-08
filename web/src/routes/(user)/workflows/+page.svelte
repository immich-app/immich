<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import WorkflowEditor from '$lib/components/workflow-page/workflow-editor.svelte';
  import WorkflowList from '$lib/components/workflow-page/workflow-list.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<UserPageLayout title={data.meta.title} scrollbar={false}>
  <section class="grid grid-cols-[25%_1fr] h-full">
    <WorkflowList />
    <WorkflowEditor />
  </section>
</UserPageLayout>
