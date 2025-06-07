<script lang="ts">
  import { IconButton } from '@immich/ui';
  import { mdiMotionPauseOutline, mdiPlaySpeed } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    isPlaying: boolean;
    onClick: (shouldPlay: boolean) => void;
  }

  let { isPlaying, onClick }: Props = $props();
</script>

<IconButton
  color="secondary"
  variant="ghost"
  shape="round"
  icon={isPlaying ? mdiMotionPauseOutline : mdiPlaySpeed}
  aria-label={isPlaying ? $t('stop_motion_photo') : $t('play_motion_photo')}
  onclick={() => onClick(!isPlaying)}
/>
