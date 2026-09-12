import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../test_utils.dart';

class _MockAssetApiRepository extends Mock implements AssetApiRepository {}

void main() {
  test('loads the original path for a remote asset', () async {
    final apiRepository = _MockAssetApiRepository();
    when(() => apiRepository.getOriginalPath('asset-1')).thenAnswer((_) async => '/data/library/photo.jpg');
    final container = ProviderContainer(overrides: [assetApiRepositoryProvider.overrideWithValue(apiRepository)]);
    addTearDown(container.dispose);

    final asset = TestUtils.createRemoteAsset(id: 'asset-1');

    expect(await container.read(assetOriginalPathProvider(asset).future), '/data/library/photo.jpg');
    verify(() => apiRepository.getOriginalPath('asset-1')).called(1);
  });
}
