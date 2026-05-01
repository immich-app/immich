<script lang="ts">
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import { AssetAction } from '$lib/constants';
  import type { AssetResponseDto, PersonResponseDto } from '@immich/sdk';

  interface Props {
    asset: AssetResponseDto;
    onAction?: (action: Action) => void;
  }

  let { asset, onAction }: Props = $props();

  const person: PersonResponseDto = {
    id: 'person-1',
    name: 'Person',
    birthDate: null,
    thumbnailPath: '',
    isHidden: false,
    isFavorite: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
    type: 'person',
    species: null,
  };
</script>

<button
  type="button"
  aria-label="set featured photo"
  onclick={() => onAction?.({ type: AssetAction.SET_PERSON_FEATURED_PHOTO, asset, person })}
>
  Set featured photo
</button>
