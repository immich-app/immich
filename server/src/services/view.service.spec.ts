import { IAssetRepository } from 'src/interfaces/asset.interface';

import { ViewService } from 'src/services/view.service';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';

import { Mocked } from 'vitest';

describe(ViewService.name, () => {
  let sut: ViewService;
  let assetMock: Mocked<IAssetRepository>;

  beforeEach(() => {
    assetMock = newAssetRepositoryMock();

    sut = new ViewService(assetMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });
});
