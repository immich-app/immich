<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { ImmichBackupsPage, orchestrationApiProvider, sdk, setProvider, YuccaContext } from 'orchestration-ui';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  sdk.defaults.baseUrl = globalThis.location.origin;
  setProvider(orchestrationApiProvider);
</script>

<svelte:head>
  <title>{data.meta.title}</title>
</svelte:head>

<YuccaContext baseUrl={globalThis.location.origin}>
  <UserPageLayout>
    <ImmichBackupsPage onExit={() => goto('/')} />
  </UserPageLayout>
</YuccaContext>
