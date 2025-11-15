<script lang="ts">
  import { PluginTriggerType, type PluginTriggerResponseDto } from '@immich/sdk';
  import { Icon, Text } from '@immich/ui';
  import { mdiFaceRecognition, mdiFileUploadOutline, mdiLightningBolt } from '@mdi/js';

  interface Props {
    trigger: PluginTriggerResponseDto;
    selected: boolean;
    onclick: () => void;
  }

  let { trigger, selected, onclick }: Props = $props();

  const getTriggerIcon = (triggerType: PluginTriggerType) => {
    switch (triggerType) {
      case PluginTriggerType.AssetCreate: {
        return mdiFileUploadOutline;
      }
      case PluginTriggerType.PersonRecognized: {
        return mdiFaceRecognition;
      }
      default: {
        return mdiLightningBolt;
      }
    }
  };
</script>

<button
  type="button"
  {onclick}
  class="rounded-xl p-4 w-full text-left transition-all cursor-pointer border-2 {selected
    ? 'border-primary text-primary'
    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-200'}"
>
  <div class="flex items-center gap-3">
    <div
      class="rounded-xl p-2 bg-gray-200 {selected
        ? 'bg-primary text-light'
        : 'text-gray-400 dark:text-gray-400 dark:bg-gray-900'}"
    >
      <Icon icon={getTriggerIcon(trigger.triggerType)} size="24" />
    </div>
    <div class="flex-1">
      <Text class="font-semibold mb-1">{trigger.name}</Text>
      {#if trigger.description}
        <Text class="text-sm text-muted-foreground">{trigger.description}</Text>
      {/if}
    </div>
  </div>
</button>
