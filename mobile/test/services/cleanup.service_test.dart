import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/services/cleanup.service.dart';
import 'package:mocktail/mocktail.dart';

import '../infrastructure/repository.mock.dart';
import '../repository.mocks.dart';

void main() {
  late CleanupService sut;

  late MockLocalAssetRepository localAssetRepository;
  late MockAssetMediaRepository assetMediaRepository;

  setUp(() {
    localAssetRepository = MockLocalAssetRepository();
    assetMediaRepository = MockAssetMediaRepository();
    sut = CleanupService(localAssetRepository, assetMediaRepository);
  });

  group('CleanupService.deleteLocalAssets', () {
    test('returns 0 and does nothing for empty input', () async {
      final result = await sut.deleteLocalAssets([]);

      expect(result, 0);
      verifyNever(() => assetMediaRepository.deleteAll(any()));
      verifyNever(() => localAssetRepository.deleteAssets(any()));
    });

    test('deletes in a single batch when under limit', () async {
      final ids = List.generate(999, (i) => 'asset-$i');

      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((invocation) async {
        return (invocation.positionalArguments.first as List<String>).toList();
      });
      when(() => localAssetRepository.deleteAssets(any())).thenAnswer((_) async {});

      final result = await sut.deleteLocalAssets(ids);

      expect(result, ids.length);
      verify(() => assetMediaRepository.deleteAll(ids)).called(1);
      verify(() => localAssetRepository.deleteAssets(ids)).called(1);
    });

    test('deletes in platform-specific batches when over limit', () async {
      final batchSize = CurrentPlatform.isAndroid ? 2000 : 10000;
      final ids = List.generate(batchSize * 2 + 501, (i) => 'asset-$i');
      final capturedBatches = <List<String>>[];

      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((invocation) async {
        final batch = (invocation.positionalArguments.first as List<String>).toList();
        capturedBatches.add(batch);
        return batch;
      });
      when(() => localAssetRepository.deleteAssets(any())).thenAnswer((_) async {});

      final result = await sut.deleteLocalAssets(ids);

      expect(result, ids.length);
      expect(capturedBatches.length, 3);
      expect(capturedBatches[0].length, batchSize);
      expect(capturedBatches[1].length, batchSize);
      expect(capturedBatches[2].length, 501);
      expect(capturedBatches[0].first, 'asset-0');
      expect(capturedBatches[0].last, 'asset-${batchSize - 1}');
      expect(capturedBatches[1].first, 'asset-$batchSize');
      expect(capturedBatches[1].last, 'asset-${batchSize * 2 - 1}');
      expect(capturedBatches[2].first, 'asset-${batchSize * 2}');
      expect(capturedBatches[2].last, 'asset-${batchSize * 2 + 500}');
      verify(() => localAssetRepository.deleteAssets(any())).called(3);
    });
  });
}
