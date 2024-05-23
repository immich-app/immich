<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';
  import UtilitiesMenu from '$lib/components/utilities-page/utilities-menu.svelte';
  import { DialogType, dialogController } from '$lib/components/shared-components/dialog/dialog';

  export let data: PageData;

  const showDialog = async (mgs: string) => {
    const result = await dialogController.show({ type: DialogType.Confirm, prompt: mgs });

    console.log('result is', result);

    console.log('After result is logged');
  };
</script>

<UserPageLayout title={data.meta.title}>
  <div class="w-full max-w-xl m-auto">
    <div class="mt-5">
      <UtilitiesMenu />
      <button on:click={() => showDialog('I am one')}>Show Dialog</button>
      <button on:click={() => showDialog('I am two')}>Show Dialog</button>
    </div>
  </div>
</UserPageLayout>
