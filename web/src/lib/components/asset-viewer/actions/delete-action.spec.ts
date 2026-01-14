import { renderWithTooltips } from '$tests/helpers';
import type { AssetResponseDto } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import '@testing-library/jest-dom';
import DeleteAction from './delete-action.svelte';

let asset: AssetResponseDto;

describe('DeleteAction component', () => {
  beforeEach(() => {
    vi.mock(import('$lib/managers/feature-flags-manager.svelte'), () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { featureFlagsManager: { init: vi.fn(), loadFeatureFlags: vi.fn(), value: { trash: true } } as any };
    });
  });

  describe('given an asset which is not trashed yet', () => {
    beforeEach(() => {
      asset = assetFactory.build({ isTrashed: false });
    });

    it('displays a button to move the asset to the trash bin', () => {
      const { getByLabelText, queryByTitle } = renderWithTooltips(DeleteAction, {
        asset,
        onAction: vi.fn(),
        preAction: vi.fn(),
      });
      expect(getByLabelText('delete')).toBeInTheDocument();
      expect(queryByTitle('deletePermanently')).toBeNull();
    });
  });

  describe('but if the asset is already trashed', () => {
    beforeEach(() => {
      asset = assetFactory.build({ isTrashed: true });
    });

    it('displays a button to permanently delete the asset', () => {
      const { getByLabelText, queryByTitle } = renderWithTooltips(DeleteAction, {
        asset,
        onAction: vi.fn(),
        preAction: vi.fn(),
      });
      expect(getByLabelText('permanently_delete')).toBeInTheDocument();
      expect(queryByTitle('delete')).toBeNull();
    });
  });
});
