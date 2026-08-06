import 'package:flutter_test/flutter_test.dart';

import '../../unit/factories/local_asset_factory.dart';
import '../../unit/factories/remote_asset_factory.dart';

void main() {
  group('BaseAsset.refersToSameAsset', () {
    test('search/folder copy (localId null) matches the merged DB copy (localId set)', () {
      // #29472: search and folder assets arrive with localId null, then the viewer
      // watches the DB copy which fills localId. heroTag embeds localId, so it
      // diverges for the same asset and isCurrent used to go false.
      final searchCopy = RemoteAssetFactory.create(id: 'asset-1');
      final mergedCopy = searchCopy.copyWith(localId: 'local-1');

      expect(searchCopy.localId, isNull);
      expect(mergedCopy.localId, 'local-1');
      expect(searchCopy.heroTag, isNot(mergedCopy.heroTag));

      expect(searchCopy.refersToSameAsset(mergedCopy), isTrue);
      expect(mergedCopy.refersToSameAsset(searchCopy), isTrue);
    });

    test('different remote assets are not the same', () {
      final a = RemoteAssetFactory.create(id: 'asset-1');
      final b = RemoteAssetFactory.create(id: 'asset-2');

      expect(a.refersToSameAsset(b), isFalse);
    });

    test('same checksum but different remote ids are not the same (duplicate files)', () {
      final a = RemoteAssetFactory.create(id: 'asset-1');
      final b = RemoteAssetFactory.create(id: 'asset-2').copyWith(checksum: a.checksum);

      expect(a.checksum, b.checksum);
      expect(a.refersToSameAsset(b), isFalse);
    });

    test('falls back to checksum when only one side has an id (local-only vs remote-only)', () {
      final remoteOnly = RemoteAssetFactory.create(id: 'asset-1');
      final localOnly = LocalAssetFactory.create(id: 'local-1').copyWith(checksum: remoteOnly.checksum);

      expect(remoteOnly.refersToSameAsset(localOnly), isTrue);
      expect(localOnly.refersToSameAsset(remoteOnly), isTrue);
    });
  });
}
