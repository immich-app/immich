<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { updatePerson, type AssetResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { mdiCheck, mdiFaceManProfile } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  interface Props {
    asset: AssetResponseDto;
    person: PersonResponseDto;
    onAction?: OnAction;
  }

  let { asset, person, onAction }: Props = $props();

  const handleSelectFeaturePhoto = async () => {
    try {
      const updatedPerson = await updatePerson({
        id: person.id,
        personUpdateDto: { featureFaceAssetId: asset.id },
      });

      person = { ...person, ...updatedPerson };

      onAction?.({
        type: AssetAction.SET_PERSON_FEATURED_PHOTO,
        asset,
        person,
      });

      toastManager.show({ title: $t('success'), description: $t('feature_photo_updated'), icon: mdiCheck });
    } catch (error) {
      handleError(error, $t('errors.unable_to_set_feature_photo'));
    }
  };
</script>

<MenuOption text={$t('set_as_featured_photo')} icon={mdiFaceManProfile} onClick={handleSelectFeaturePhoto} />
