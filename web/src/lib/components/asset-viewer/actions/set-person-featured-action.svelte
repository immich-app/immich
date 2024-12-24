<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { updatePerson, type AssetResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { mdiFaceManProfile } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    person: PersonResponseDto;
  }

  let { asset, person }: Props = $props();

  const handleSelectFeaturePhoto = async () => {
    try {
      await updatePerson({ id: person.id, personUpdateDto: { featureFaceAssetId: asset.id } });
      notificationController.show({ message: $t('feature_photo_updated'), type: NotificationType.Info });
    } catch (error) {
      handleError(error, $t('errors.unable_to_set_feature_photo'));
    }
  };
</script>

<MenuOption text={$t('set_as_featured_photo')} icon={mdiFaceManProfile} onClick={handleSelectFeaturePhoto} />
