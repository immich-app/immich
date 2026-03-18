<script lang="ts">
  import UserSettingsList from '$lib/components/user-settings-page/user-settings-list.svelte';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();
</script>

<UserSettingsList sessions={data.sessions} />
