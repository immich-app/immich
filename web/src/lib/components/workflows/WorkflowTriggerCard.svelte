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
  class="group rounded-xl p-4 w-full text-left cursor-pointer border-2 {selected
    ? 'border-primary text-primary'
    : 'border-light-100 hover:border-light-200 text-light-400 hover:text-light-700'}"
>
  <div class="flex items-center gap-3">
    <div
      class="rounded-xl p-2 {selected
        ? 'bg-primary text-light'
        : 'text-light-100 bg-light-300 group-hover:bg-light-500'}"
    >
      <Icon icon={getTriggerIcon(trigger.type)} size="24" />
    </div>
    <div class="flex-1">
      <Text class="font-semibold mb-1">{trigger.name}</Text>
      {#if trigger.description}
        <Text size="small">{trigger.description}</Text>
      {/if}
    </div>
  </div>
</button>
