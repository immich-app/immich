<script lang="ts">
  import AdminPageLayout from '#lib/components/layouts/AdminPageLayout.svelte';
  import { Container } from '@immich/ui';
  import type { PageData } from './$types';
  import ServerStatisticsPanel from './ServerStatisticsPanel.svelte';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]}>
  <Container size="large" center>
    <ServerStatisticsPanel />
  </Container>
</AdminPageLayout>
