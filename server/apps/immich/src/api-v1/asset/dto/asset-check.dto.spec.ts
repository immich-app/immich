import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AssetBulkUploadCheckDto } from './asset-check.dto';

describe('CheckExistingAssetsDto', () => {
  it('should fail with an empty list', () => {
    const dto = plainToInstance(AssetBulkUploadCheckDto, { deviceAssetIds: [], deviceId: 'test-device' });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('deviceAssetIds');
  });

  it('should fail with an empty string', () => {
    const dto = plainToInstance(AssetBulkUploadCheckDto, { deviceAssetIds: [''], deviceId: 'test-device' });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('deviceAssetIds');
  });

  it('should work with valid asset ids', () => {
    const dto = plainToInstance(AssetBulkUploadCheckDto, {
      deviceAssetIds: ['asset-1', 'asset-2'],
      deviceId: 'test-device',
    });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
  });
});
