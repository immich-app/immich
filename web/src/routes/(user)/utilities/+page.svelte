<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';
  import UtilitiesMenu from '$lib/components/utilities-page/utilities-menu.svelte';

  export let data: PageData;
</script>

<UserPageLayout title={data.meta.title}>
  <div class="w-full max-w-xl m-auto">
    <div class="mt-5">
      <UtilitiesMenu />
    </div>
  </div>
</UserPageLayout>
