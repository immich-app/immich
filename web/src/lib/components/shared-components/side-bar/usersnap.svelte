<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiBullhornOutline } from '@mdi/js';
  import { onMount } from 'svelte';

  interface UsersnapApi {
    init: () => void;
    logEvent: (event: string) => void;
  }

  let api: UsersnapApi | undefined = $state(undefined);

  onMount(() => {
    const g = globalThis as Record<string, unknown>;
    g.onUsersnapLoad = (usersnapApi: UsersnapApi) => {
      usersnapApi.init();
      api = usersnapApi;
    };
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://widget.usersnap.com/global/load/31ff0595-9181-4691-b60a-e6e069537661?onload=onUsersnapLoad';
    document.head.append(script);

    return () => {
      script.remove();
      delete g.onUsersnapLoad;
      api = undefined;
    };
  });
</script>

<div class="ps-4 text-sm">
  <button
    type="button"
    id="feedbackButton"
    onclick={() => api?.logEvent('open_feedback')}
    class="p-2 flex justify-between place-items-center place-content-center border border-immich-primary/20 dark:border-immich-dark-primary/10 mt-2 rounded-lg shadow-md dark:bg-immich-dark-primary/10 min-w-52 w-full"
  >
    <div class="flex justify-between w-full place-items-center place-content-center">
      <div class="flex place-items-center place-content-center gap-1">
        <Icon icon={mdiBullhornOutline} class="text-primary" size="24" />
        <p class="flex text-primary font-medium">Give us feedback</p>
      </div>
    </div>
  </button>
</div>
