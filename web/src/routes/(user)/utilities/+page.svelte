<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import type { PageData } from './$types';
  import UtilitiesMenu from './UtilitiesMenu.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<UserPageLayout title={data.meta.title}>
  <div class="m-auto w-full max-w-xl">
    <div class="mt-5">
      <UtilitiesMenu />
    </div>
  </div>
</UserPageLayout>
