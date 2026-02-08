import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/services/cleanup.service.dart';
import 'package:mocktail/mocktail.dart';

import '../infrastructure/repository.mock.dart';
import '../repository.mocks.dart';

void main() {
  late CleanupService sut;

  late MockDriftLocalAssetRepository localAssetRepository;
  late MockAssetMediaRepository assetMediaRepository;

  setUp(() {
    localAssetRepository = MockDriftLocalAssetRepository();
    assetMediaRepository = MockAssetMediaRepository();
    sut = CleanupService(localAssetRepository, assetMediaRepository);
  });

  group('CleanupService.deleteLocalAssets', () {
    test('returns 0 and does nothing for empty input', () async {
      final result = await sut.deleteLocalAssets([]);

      expect(result, 0);
      verifyNever(() => assetMediaRepository.deleteAll(any()));
      verifyNever(() => localAssetRepository.delete(any()));
    });

    test('deletes in a single batch when under limit', () async {
      final ids = List.generate(999, (i) => 'asset-$i');

      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((invocation) async {
        return (invocation.positionalArguments.first as List<String>).toList();
      });
      when(() => localAssetRepository.delete(any())).thenAnswer((_) async {});

      final result = await sut.deleteLocalAssets(ids);

      expect(result, ids.length);
      verify(() => assetMediaRepository.deleteAll(ids)).called(1);
      verify(() => localAssetRepository.delete(ids)).called(1);
    });

    test('deletes in 1000-item batches when over limit', () async {
      final ids = List.generate(2501, (i) => 'asset-$i');
      final capturedBatches = <List<String>>[];

      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((invocation) async {
        final batch = (invocation.positionalArguments.first as List<String>).toList();
        capturedBatches.add(batch);
        return batch;
      });
      when(() => localAssetRepository.delete(any())).thenAnswer((_) async {});

      final result = await sut.deleteLocalAssets(ids);

      expect(result, ids.length);
      expect(capturedBatches.length, 3);
      expect(capturedBatches[0].length, 1000);
      expect(capturedBatches[1].length, 1000);
      expect(capturedBatches[2].length, 501);
      expect(capturedBatches[0].first, 'asset-0');
      expect(capturedBatches[0].last, 'asset-999');
      expect(capturedBatches[1].first, 'asset-1000');
      expect(capturedBatches[1].last, 'asset-1999');
      expect(capturedBatches[2].first, 'asset-2000');
      expect(capturedBatches[2].last, 'asset-2500');
      verify(() => localAssetRepository.delete(any())).called(3);
    });
  });
}
