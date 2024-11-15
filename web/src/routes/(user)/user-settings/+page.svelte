<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import UserSettingsList from '$lib/components/user-settings-page/user-settings-list.svelte';
  import { mdiKeyboard } from '@mdi/js';
  import type { PageData } from './$types';
  import ShowShortcuts from '$lib/components/shared-components/show-shortcuts.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    data: PageData;
    isShowKeyboardShortcut?: boolean;
  }

  let { data, isShowKeyboardShortcut = $bindable(false) }: Props = $props();
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <CircleIconButton
      icon={mdiKeyboard}
      title={$t('show_keyboard_shortcuts')}
      onclick={() => (isShowKeyboardShortcut = !isShowKeyboardShortcut)}
    />
  {/snippet}
  <section class="mx-4 flex place-content-center">
    <div class="w-full max-w-3xl">
      <UserSettingsList keys={data.keys} sessions={data.sessions} />
    </div>
  </section>
</UserPageLayout>

{#if isShowKeyboardShortcut}
  <ShowShortcuts onClose={() => (isShowKeyboardShortcut = false)} />
{/if}
