import 'dart:async';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:immich_mobile/domain/utils/cloud_id_resolver.dart';
import 'package:immich_mobile/domain/utils/migrate_cloud_ids.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/cancel.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../service.mocks.dart';
import '../repository_context.dart';

class _MockSyncStreamService extends Mock implements SyncStreamService {}

void main() {
  late MediumRepositoryContext ctx;
  late MockNativeSyncApi mockNativeSyncApi;
  late LocalAlbumRepository albumRepository;

  setUp(() {
    debugDefaultTargetPlatformOverride = .iOS;
    ctx = MediumRepositoryContext();
    mockNativeSyncApi = MockNativeSyncApi();
    albumRepository = LocalAlbumRepository(ctx.db);
  });

  tearDown(() async {
    debugDefaultTargetPlatformOverride = null;
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

  test('cloud-ID synchronization forwards a remote privacy reset even if the sync later fails', () async {
    final sync = _MockSyncStreamService();
    when(() => sync.sync(onAssetAccessChanged: any(named: 'onAssetAccessChanged'))).thenAnswer((invocation) async {
      final notify = invocation.namedArguments[#onAssetAccessChanged] as void Function()?;
      notify?.call();
      throw StateError('Remote sync interrupted after privacy reset');
    });
    final ref = ProviderContainer(
      overrides: [
        driftProvider.overrideWithValue(ctx.db),
        nativeSyncApiProvider.overrideWithValue(mockNativeSyncApi),
        cancellationProvider.overrideWithValue(Completer<void>()),
        syncStreamServiceProvider.overrideWithValue(sync),
      ],
    );
    addTearDown(ref.dispose);
    var notifications = 0;

    await syncCloudIds(ref, onAssetAccessChanged: () => notifications++);

    expect(notifications, 1);
  });

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
