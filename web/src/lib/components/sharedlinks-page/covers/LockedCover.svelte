<script lang="ts">
  import { cleanClass } from '$lib';
  import { Icon } from '@immich/ui';
  import { mdiLock } from '@mdi/js';

  interface Props {
    alt?: string;
    preload?: boolean;
    class?: string;
  }

  // `preload` is accepted for prop-shape parity with AssetCover/NoCover but unused here --
  // there's no image element for this static placeholder to eagerly load.
  let { alt = '', class: className }: Props = $props();
</script>

<!--
  Deliberately never requests the real thumbnail image for a locked album -- the point is both
  to signal "locked" at a glance and to avoid firing an asset request that the server would just
  deny (or, worse, serve) depending on elevation state. The actual photos only ever load once
  the album itself is opened and unlocked with a PIN.
-->
<div
  class={cleanClass(
    'flex size-full items-center justify-center rounded-xl bg-gray-200 aspect-square dark:bg-gray-800',
    className,
  )}
  data-testid="album-image"
  role="img"
  aria-label={alt}
>
  <Icon icon={mdiLock} size="48" class="text-gray-400 dark:text-gray-600" />
</div>
