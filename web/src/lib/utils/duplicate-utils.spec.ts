import { computeDifferingMetadataFields } from '#lib/utils/duplicate-utils.ts';
import { factory } from '#test/unit/factories.ts';

describe('computeDifferingMetadataFields', () => {
  it('marks a field as differing when only one duplicate has it', () => {
    const withMake = factory.asset({ exifInfo: { make: 'Canon' } });
    const withoutMake = factory.asset({ exifInfo: { make: null } });

    const differing = computeDifferingMetadataFields([withMake, withoutMake]);

    expect(differing.make).toBe(true);
  });

  it('does not mark a field when every duplicate has the same value', () => {
    const assets = [factory.asset({ exifInfo: { make: 'Canon' } }), factory.asset({ exifInfo: { make: 'Canon' } })];

    expect(computeDifferingMetadataFields(assets).make).toBe(false);
  });
});
