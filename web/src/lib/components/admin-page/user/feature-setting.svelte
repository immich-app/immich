<script lang="ts">
  import { Icon, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { mdiCheck, mdiClose } from '@mdi/js';

  interface Props {
    title: string;
    state: boolean;
  }

  let { title, state }: Props = $props();
</script>

<div class="flex justify-between items-center">
  <Text class="text-sm font-medium">{title}</Text>
  <Icon
    icon={state ? mdiCheck : mdiClose}
    class={state ? 'text-immich-primary dark:text-immich-dark-primary' : 'text-gray-400 dark:text-gray-600'}
    size="24"
  />
</div>
