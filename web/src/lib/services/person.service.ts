import PersonEditAccessModal from '#lib/modals/PersonEditAccessModal.svelte';
import PersonEditModal from '#lib/modals/PersonEditModal.svelte';
import { executeMutation } from '#lib/queries/client.ts';
import { updatePersonMutation } from '#lib/queries/person.query.ts';
import { type AssetResponseDto, type PersonResponseDto } from '@immich/sdk';
import { modalManager, type ActionItem } from '@immich/ui';
import {
  mdiAccountMultipleOutline,
  mdiEyeOffOutline,
  mdiEyeOutline,
  mdiFaceManProfile,
  mdiHeartMinusOutline,
  mdiHeartOutline,
  mdiPencilOutline,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getPersonActions = (
  $t: MessageFormatter,
  person: PersonResponseDto,
  { onHide }: { onHide?: () => void } = {},
) => {
  const Edit: ActionItem = {
    title: $t('edit_person'),
    icon: mdiPencilOutline,
    onAction: () => modalManager.show(PersonEditModal, { person }),
    shortcuts: { key: 'e' },
  };

  const Favorite: ActionItem = {
    title: $t('to_favorite'),
    icon: mdiHeartOutline,
    $if: () => !person.isFavorite,
    onAction: () =>
      executeMutation(
        () =>
          updatePersonMutation({
            success: { toast: 'added_to_favorites' },
            error: { toast: 'errors.unable_to_change_favorite' },
          }),
        [{ id: person.id, personUpdateDto: { isFavorite: true } }],
      ),
    shortcuts: { key: 'f' },
  };

  const Unfavorite: ActionItem = {
    title: $t('unfavorite'),
    icon: mdiHeartMinusOutline,
    $if: () => !!person.isFavorite,
    onAction: () =>
      executeMutation(
        () =>
          updatePersonMutation({
            success: { toast: 'removed_from_favorites' },
            error: { toast: 'errors.unable_to_change_favorite' },
          }),
        [{ id: person.id, personUpdateDto: { isFavorite: false } }],
      ),
    shortcuts: { key: 'f' },
  };

  const HidePerson: ActionItem = {
    title: $t('hide_person'),
    icon: mdiEyeOffOutline,
    $if: () => !person.isHidden,
    onAction: () =>
      executeMutation(
        () =>
          updatePersonMutation({
            success: { toast: 'changed_visibility_successfully' },
            error: { toast: 'errors.unable_to_hide_person' },
          }),
        [{ id: person.id, personUpdateDto: { isHidden: true } }],
        { onSuccess: onHide },
      ),
    shortcuts: { key: 'h' },
  };

  const ShowPerson: ActionItem = {
    title: $t('unhide_person'),
    icon: mdiEyeOutline,
    $if: () => person.isHidden,
    onAction: () =>
      executeMutation(
        () => updatePersonMutation({ success: { toast: 'changed_visibility_successfully' } }),
        [{ id: person.id, personUpdateDto: { isHidden: false } }],
      ),
    shortcuts: { key: 'h' },
  };

  const Access: ActionItem = {
    title: $t('manage_person_access'),
    icon: mdiAccountMultipleOutline,
    onAction: () => modalManager.show(PersonEditAccessModal, { person }),
  };

  return { Edit, Favorite, Unfavorite, HidePerson, ShowPerson, Access };
};

export const getPersonAssetActions = ($t: MessageFormatter, person: PersonResponseDto, asset: AssetResponseDto) => {
  const SetFeaturedPhoto: ActionItem = {
    title: $t('set_as_featured_photo'),
    icon: mdiFaceManProfile,
    onAction: () =>
      executeMutation(
        () =>
          updatePersonMutation({
            success: { toast: 'feature_photo_updated' },
            error: { toast: 'errors.unable_to_set_feature_photo' },
          }),
        [{ id: person.id, personUpdateDto: { featureFaceAssetId: asset.id } }],
      ),
  };

  return { SetFeaturedPhoto };
};
