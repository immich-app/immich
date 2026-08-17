import 'dart:async';

import 'package:drift/drift.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/utils/cloud_id_resolver.dart';
import 'package:immich_mobile/domain/utils/migrate_cloud_ids.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:mocktail/mocktail.dart';

import '../../service.mocks.dart';
import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late MockNativeSyncApi mockNativeSyncApi;
  late DriftLocalAlbumRepository albumRepository;

  setUp(() {
    ctx = MediumRepositoryContext();
    mockNativeSyncApi = MockNativeSyncApi();
    albumRepository = DriftLocalAlbumRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  Future<List<String?>> readCloudIds() async {
    final rows = await ctx.db.localAssetEntity.select().get();
    return rows.map((row) => row.iCloudId).toList();
  }

  void resolvingAllInputs() {
    when(() => mockNativeSyncApi.getCloudIdForAssetIds(any())).thenAnswer(
      (invocation) async => (invocation.positionalArguments.first as List<String>)
          .map((id) => CloudIdResult(assetId: id, cloudId: 'cloud-$id'))
          .toList(),
    );
  }

  group('populateCloudIds', () {
    test('writes the cloud ID resolved for each asset', () async {
      await ctx.newLocalAsset(id: 'asset-0', iCloudIdOption: const .none());
      resolvingAllInputs();

      await populateMissingCloudIds(ctx.db, mockNativeSyncApi, .new());
      expect(await readCloudIds(), ['cloud-asset-0']);
    });

    test('skips assets that already have a cloud ID', () async {
      await ctx.newLocalAsset(iCloudId: 'existing');

      await populateMissingCloudIds(ctx.db, mockNativeSyncApi, .new());

      verifyNever(() => mockNativeSyncApi.getCloudIdForAssetIds(any()));
      expect(await readCloudIds(), ['existing']);
    });

    test('does not call the native API when already cancelled', () async {
      await ctx.newLocalAsset(iCloudIdOption: const .none());

      await populateMissingCloudIds(ctx.db, mockNativeSyncApi, .new()..complete());

      verifyNever(() => mockNativeSyncApi.getCloudIdForAssetIds(any()));
      expect(await readCloudIds(), [null]);
    });
  });

  group('resolveCloudIds', () {
    test('resolves and stores more assets than fit in a single chunk', () async {
      final ids = List.generate(kCloudIdChunkSize + 1, (i) => 'asset-$i');
      for (final id in ids) {
        await ctx.newLocalAsset(id: id, iCloudIdOption: const .none());
      }
      resolvingAllInputs();

      await resolveCloudIds(mockNativeSyncApi, albumRepository, ids);

      verify(() => mockNativeSyncApi.getCloudIdForAssetIds(any())).called(2);
      final stored = await ctx.db.localAssetEntity.select().get();
      expect(stored.every((row) => row.iCloudId == 'cloud-${row.id}'), isTrue);
    });

    test('stops after the first chunk when cloud IDs are unsupported', () async {
      final ids = List.generate(kCloudIdChunkSize + 1, (i) => 'asset-$i');
      when(
        () => mockNativeSyncApi.getCloudIdForAssetIds(any()),
      ).thenThrow(PlatformException(code: kUnsupportedOSError));

      await resolveCloudIds(mockNativeSyncApi, albumRepository, ids);

      verify(() => mockNativeSyncApi.getCloudIdForAssetIds(any())).called(1);
    });

    test('stops between chunks once cancelled', () async {
      final ids = List.generate(kCloudIdChunkSize + 1, (i) => 'asset-$i');
      final cancellation = Completer<void>();
      when(() => mockNativeSyncApi.getCloudIdForAssetIds(any())).thenAnswer((invocation) async {
        cancellation.complete();
        return (invocation.positionalArguments.first as List<String>)
            .map((id) => CloudIdResult(assetId: id, cloudId: 'cloud-$id'))
            .toList();
      });

      await resolveCloudIds(mockNativeSyncApi, albumRepository, ids, cancellation: cancellation);

      verify(() => mockNativeSyncApi.getCloudIdForAssetIds(any())).called(1);
    });
  });
}
