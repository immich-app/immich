<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import ProfileImageCropperModal from '$lib/modals/ProfileImageCropperModal.svelte';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiAccountCircleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();
</script>

<MenuOption
  icon={mdiAccountCircleOutline}
  onClick={() => modalManager.show(ProfileImageCropperModal, { asset })}
  text={$t('set_as_profile_picture')}
/>
