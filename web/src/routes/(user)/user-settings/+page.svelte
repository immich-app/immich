<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import UserSettingsList from '$lib/components/user-settings-page/user-settings-list.svelte';
  import { mdiKeyboard } from '@mdi/js';
  import type { PageData } from './$types';
  import ShowShortcuts from '$lib/components/shared-components/show-shortcuts.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';

  export let data: PageData;
  export let isShowKeyboardShortcut = false;
</script>

<UserPageLayout title={data.meta.title}>
  <svelte:fragment slot="buttons">
    <CircleIconButton
      icon={mdiKeyboard}
      title="Show keyboard shortcuts"
      on:click={() => (isShowKeyboardShortcut = !isShowKeyboardShortcut)}
    />
  </svelte:fragment>
  <section class="mx-4 flex place-content-center">
    <div class="w-full max-w-3xl">
      <UserSettingsList keys={data.keys} sessions={data.sessions} />
    </div>
  </section>
</UserPageLayout>

{#if isShowKeyboardShortcut}
  <ShowShortcuts on:close={() => (isShowKeyboardShortcut = false)} />
{/if}
