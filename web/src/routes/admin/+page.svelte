<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { api, ServerStatsResponseDto, UserResponseDto } from '@api';

  export let data: PageData;
  let serverStat: ServerStatsResponseDto;


  onMount(() => {
    getServerStats();
  });


  const getServerStats = async () => {
    try {
      const res = await api.serverInfoApi.getStats();
      serverStat = res.data;
    } catch (e) {
      console.log(e);
    }
  };
</script>



