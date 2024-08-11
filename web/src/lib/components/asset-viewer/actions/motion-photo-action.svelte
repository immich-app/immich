<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { mdiMotionPauseOutline, mdiPlaySpeed } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let isPlaying: boolean;
  export let onClick: (shouldPlay: boolean) => void;
</script>

<CircleIconButton
  color="opaque"
  icon={isPlaying ? mdiMotionPauseOutline : mdiPlaySpeed}
  title={isPlaying ? $t('stop_motion_photo') : $t('play_motion_photo')}
  on:click={() => onClick(!isPlaying)}
/>
