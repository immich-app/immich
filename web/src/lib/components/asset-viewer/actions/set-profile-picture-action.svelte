<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import ProfileImageCropper from '$lib/components/shared-components/profile-image-cropper.svelte';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiAccountCircleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let asset: AssetResponseDto;

  let showProfileImageCrop = false;
</script>

<MenuOption
  icon={mdiAccountCircleOutline}
  onClick={() => (showProfileImageCrop = true)}
  text={$t('set_as_profile_picture')}
/>

{#if showProfileImageCrop}
  <Portal target="body">
    <ProfileImageCropper {asset} onClose={() => (showProfileImageCrop = false)} />
  </Portal>
{/if}
