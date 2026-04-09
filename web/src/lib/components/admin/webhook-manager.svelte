<script lang="ts">
  export let webhooks: Array<{
    id: string;
    url: string;
    events: string[];
    enabled: boolean;
    lastDeliveryAt?: string;
    lastDeliveryStatus?: string;
  }> = [];

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    create: void;
    toggle: { id: string; enabled: boolean };
    delete: string;
    test: string;
  }>();

  function handleCreate() {
    dispatch('create');
  }

  function handleToggle(id: string, currentState: boolean) {
    dispatch('toggle', { id, enabled: !currentState });
  }

  function handleDelete(id: string) {
    dispatch('delete', id);
  }

  function handleTest(id: string) {
    dispatch('test', id);
  }

  function getStatusColor(status: string | undefined): string {
    if (!status) return 'text-gray-400';
    if (status === '200' || status === '201') return 'text-green-600 dark:text-green-400';
    if (status?.startsWith('4')) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }
</script>

<div class="webhook-manager">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
      🔗 Webhooks
    </h3>
    <button
      on:click={handleCreate}
      class="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
    >
      + Add Webhook
    </button>
  </div>

  {#if webhooks.length > 0}
    <div class="space-y-3">
      {#each webhooks as webhook}
        <div class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 {webhook.enabled ? '' : 'opacity-60'}">
          <button
            on:click={() => handleToggle(webhook.id, webhook.enabled)}
            class="flex-shrink-0 w-10 h-6 rounded-full transition-colors {webhook.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} relative"
          >
            <span class="absolute top-0.5 {webhook.enabled ? 'right-0.5' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow transition-all" />
          </button>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">{webhook.url}</p>
            <div class="flex flex-wrap gap-1 mt-1">
              {#each webhook.events.slice(0, 4) as event}
                <span class="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                  {event}
                </span>
              {/each}
              {#if webhook.events.length > 4}
                <span class="text-xs text-gray-400">+{webhook.events.length - 4} more</span>
              {/if}
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            {#if webhook.lastDeliveryStatus}
              <span class="text-xs {getStatusColor(webhook.lastDeliveryStatus)}">
                {webhook.lastDeliveryStatus}
              </span>
            {/if}
            <button
              on:click={() => handleTest(webhook.id)}
              class="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
              title="Send test event"
            >
              🧪
            </button>
            <button
              on:click={() => handleDelete(webhook.id)}
              class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
              title="Delete webhook"
            >
              🗑
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
      <p>No webhooks configured</p>
      <p class="text-xs mt-1">Webhooks notify external services about events in Immich</p>
    </div>
  {/if}
</div>
