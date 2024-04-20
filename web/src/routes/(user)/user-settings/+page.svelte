<script lang="ts">
  import IconButton from '$lib/components/elements/buttons/icon-button.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import UserSettingsList from '$lib/components/user-settings-page/user-settings-list.svelte';
  import { mdiKeyboard } from '@mdi/js';
  import type { PageData } from './$types';
  import Icon from '$lib/components/elements/icon.svelte';
  import ShowShortcuts from '$lib/components/shared-components/show-shortcuts.svelte';

  export let data: PageData;
  export let isShowKeyboardShortcut = false;
</script>

<UserPageLayout title={data.meta.title}>
  <svelte:fragment slot="buttons">
    <IconButton on:click={() => (isShowKeyboardShortcut = !isShowKeyboardShortcut)}>
      <Icon path={mdiKeyboard} />
    </IconButton>
  </svelte:fragment>
  <section class="mx-4 flex place-content-center">
    <div class="w-full max-w-3xl">
      <UserSettingsList keys={data.keys} devices={data.devices} />
    </div>
  </section>
</UserPageLayout>

{#if isShowKeyboardShortcut}
  <ShowShortcuts on:close={() => (isShowKeyboardShortcut = false)} />
{/if}
