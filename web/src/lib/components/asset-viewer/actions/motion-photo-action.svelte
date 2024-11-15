<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { mdiMotionPauseOutline, mdiPlaySpeed } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    isPlaying: boolean;
    onClick: (shouldPlay: boolean) => void;
  }

  let { isPlaying, onClick }: Props = $props();
</script>

<CircleIconButton
  color="opaque"
  icon={isPlaying ? mdiMotionPauseOutline : mdiPlaySpeed}
  title={isPlaying ? $t('stop_motion_photo') : $t('play_motion_photo')}
  onclick={() => onClick(!isPlaying)}
/>
