import { type AssetResponseDto } from '@immich/sdk';

import { assetFactory } from '@test-data/factories/asset-factory';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import DeleteButton from './delete-button.svelte';

let asset: AssetResponseDto;

describe('DeleteButton component', () => {
  describe('given an asset which is not trashed yet', () => {
    beforeEach(() => {
      asset = assetFactory.build({ isTrashed: false });
    });

    it('displays a button to move the asset to the trash bin', () => {
      const { getByTitle, queryByTitle } = render(DeleteButton, { asset });
      expect(getByTitle('delete')).toBeInTheDocument();
      expect(queryByTitle('deletePermanently')).toBeNull();
    });
  });

  describe('but if the asset is already trashed', () => {
    beforeEach(() => {
      asset = assetFactory.build({ isTrashed: true });
    });

    it('displays a button to permanently delete the asset', () => {
      const { getByTitle, queryByTitle } = render(DeleteButton, { asset });
      expect(getByTitle('permanently_delete')).toBeInTheDocument();
      expect(queryByTitle('delete')).toBeNull();
    });
  });
});
