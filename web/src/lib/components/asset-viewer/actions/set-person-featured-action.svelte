<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import { getAssetControlContext } from '$lib/utils/context';
  import { handleError } from '$lib/utils/handle-error';
  import { updatePerson, type AssetResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { mdiFaceManProfile } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  interface Props {
    asset?: AssetResponseDto;
    person: PersonResponseDto;
    onAction?: OnAction;
    menuItem?: boolean;
    onPersonUpdate?: (person: PersonResponseDto) => void;
  }

  let { asset, person = $bindable(), onAction, menuItem = false, onPersonUpdate }: Props = $props();

  const handleSelectFeaturePhoto = async () => {
    let assetId: string;

    if (menuItem) {
      const { getAssets, clearSelect } = getAssetControlContext();
      const assets = getAssets();
      if (assets.length !== 1) {
        return;
      }
      assetId = assets[0].id;
      clearSelect();
    } else {
      if (!asset) {
        return;
      }
      assetId = asset.id;
    }

    try {
      const updatedPerson = await updatePerson({
        id: person.id,
        personUpdateDto: { featureFaceAssetId: assetId },
      });

      const mergedPerson = { ...person, ...updatedPerson };
      person = mergedPerson;
      onPersonUpdate?.(mergedPerson);

      if (!menuItem && asset) {
        onAction?.({
          type: AssetAction.SET_PERSON_FEATURED_PHOTO,
          asset,
          person: mergedPerson,
        });
      }

      toastManager.success($t('feature_photo_updated'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_set_feature_photo'));
    }
  };
</script>

<MenuOption text={$t('set_as_featured_photo')} icon={mdiFaceManProfile} onClick={handleSelectFeaturePhoto} />
