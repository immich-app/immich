import 'dart:async';
import 'dart:io';

import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/stack.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/services/edit_pair.dart';
import 'package:mocktail/mocktail.dart';

import '../mocks.dart';

void main() {
  final mocks = RepositoryMocks();

  // createdAt fixed; adjustmentTime is what moves a real edit past the gate.
  LocalAsset asset({
    DateTime? adjustmentTime,
    String? priorRemoteId,
    String? syncedChecksum,
    String? checksum = 'local-sha1',
  }) => LocalAsset(
    id: 'local-1',
    name: 'photo.jpg',
    type: AssetType.image,
    createdAt: DateTime(2025, 1, 1, 12),
    updatedAt: DateTime(2025, 1, 1, 12),
    playbackStyle: AssetPlaybackStyle.image,
    isEdited: false,
    adjustmentTime: adjustmentTime,
    priorRemoteId: priorRemoteId,
    syncedChecksum: syncedChecksum,
    checksum: checksum,
  );

  BaseResource base(String sha1, {String path = '/tmp/none'}) =>
      BaseResource(path: path, sha1: sha1);

  String tempFile(String name) {
    final dir = Directory.systemTemp.createTempSync('edit_pair_test');
    addTearDown(() {
      if (dir.existsSync()) {
        dir.deleteSync(recursive: true);
      }
    });
    return (File('${dir.path}/$name')..writeAsStringSync('bytes')).path;
  }

  void stubBase(BaseResource? result) {
    when(
      () => mocks.nativeApi.getBaseResource('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
    ).thenAnswer((_) async => result);
  }

  Future<EditPairPlan> resolve(LocalAsset asset, {String? ownerId = 'owner-1'}) =>
      resolveEditPair(mocks.nativeApi, asset, stackRepository: mocks.stack, ownerId: ownerId);

  void stubLive(BaseLivePhoto? result) {
    when(
      () => mocks.nativeApi.getBaseLivePhoto('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
    ).thenAnswer((_) async => result);
  }

  Future<EditPairPlan> resolveLive(LocalAsset asset, {String? ownerId = 'owner-1'}) =>
      resolveEditPair(mocks.nativeApi, asset, stackRepository: mocks.stack, ownerId: ownerId, isLivePhoto: true);

  setUp(() {
    // Default: the prior remote is alive, so absorb is allowed.
    when(() => mocks.stack.priorState(any())).thenAnswer((_) async => PriorState.live);
    // Default: the base bytes aren't already on the server.
    when(
      () => mocks.stack.remoteByChecksum(any(), any()),
    ).thenAnswer((_) async => (state: PriorState.missing, remoteId: null));
  });

  tearDown(() {
    mocks.reset();
  });

  group('resolveEditPair', () {
    test('reuses the prior remote when the asset was already uploaded as an edit', () async {
      final plan = await resolve(asset(priorRemoteId: 'remote-edit'));

      expect(plan, isA<AbsorbIntoPrior>().having((p) => p.parentId, 'parentId', 'remote-edit'));
      verifyNever(() => mocks.nativeApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('defers when the prior remote sits in the server trash', () async {
      when(() => mocks.stack.priorState('remote-edit')).thenAnswer((_) async => PriorState.trashed);

      // Stacking onto a trashed prior would 400; wait for restore or empty-trash.
      final plan = await resolve(asset(priorRemoteId: 'remote-edit', adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<DeferEditPair>());
      verifyNever(() => mocks.nativeApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('resumes onto a missing prior when the chain has not synced back yet', () async {
      when(() => mocks.stack.priorState('remote-edit')).thenAnswer((_) async => PriorState.missing);

      // syncedChecksum unset = mid-flight chain; the row simply hasn't synced.
      final plan = await resolve(asset(priorRemoteId: 'remote-edit', adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<AbsorbIntoPrior>().having((p) => p.parentId, 'parentId', 'remote-edit'));
      verifyNever(() => mocks.nativeApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('rebuilds from scratch when a completed prior vanished from the server', () async {
      when(() => mocks.stack.priorState('remote-edit')).thenAnswer((_) async => PriorState.missing);
      stubBase(base('different-sha1'));

      final plan = await resolve(
        asset(
          priorRemoteId: 'remote-edit',
          syncedChecksum: 'synced-sha1',
          adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30),
        ),
      );

      expect(plan, isA<UploadBaseFirst>());
      verify(() => mocks.nativeApi.getBaseResource('local-1', allowNetworkAccess: true)).called(1);
    });

    test('skips when the vanished prior\'s asset reads as not edited', () async {
      when(() => mocks.stack.priorState('remote-edit')).thenAnswer((_) async => PriorState.missing);

      // Fresh resolution from scratch: no adjustment → nothing to stack.
      final plan = await resolve(asset(priorRemoteId: 'remote-edit', syncedChecksum: 'synced-sha1'));

      expect(plan, isA<NoEditPair>());
      verifyNever(() => mocks.nativeApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('defers when the prior lookup itself fails', () async {
      when(() => mocks.stack.priorState('remote-edit')).thenThrow(Exception('db error'));

      final plan = await resolve(asset(priorRemoteId: 'remote-edit'));

      expect(plan, isA<DeferEditPair>());
      verifyNever(() => mocks.nativeApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('skips a photo that was never adjusted without touching native', () async {
      final plan = await resolve(asset(adjustmentTime: null));

      expect(plan, isA<NoEditPair>());
      verifyNever(() => mocks.nativeApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('skips a capture-time style (adjustment within the 2s window)', () async {
      final plan = await resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 1)));

      expect(plan, isA<NoEditPair>());
      verifyNever(() => mocks.nativeApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('skips at exactly the 2s boundary (tolerance is exclusive)', () async {
      final plan = await resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 2)));

      expect(plan, isA<NoEditPair>());
      verifyNever(() => mocks.nativeApi.getBaseResource(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('checks the original just past the 2s boundary', () async {
      stubBase(base('different-sha1'));

      final plan = await resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 3)));

      expect(plan, isA<UploadBaseFirst>());
      verify(() => mocks.nativeApi.getBaseResource('local-1', allowNetworkAccess: true)).called(1);
    });

    test('uploads the original first when a real edit moved the timestamp', () async {
      stubBase(base('different-sha1'));

      final plan = await resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<UploadBaseFirst>());
      verify(() => mocks.nativeApi.getBaseResource('local-1', allowNetworkAccess: true)).called(1);
    });

    test('skips when the original is positively gone (native returned null)', () async {
      stubBase(null);

      final plan = await resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<NoEditPair>());
    });

    test('skips when the original bytes match the asset (auto-HDR, nothing to stack)', () async {
      final basePath = tempFile('base.jpg');
      stubBase(base('local-sha1', path: basePath));

      final plan = await resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<NoEditPair>());
      // The temp copy is dropped, not leaked.
      expect(File(basePath).existsSync(), isFalse);
    });

    test('defers when reading the original throws (unreadable plist, iCloud hiccup)', () async {
      when(
        () => mocks.nativeApi.getBaseResource('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenThrow(Exception('boom'));

      final plan = await resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<DeferEditPair>());
    });

    test('defers when the base read never replies (platform-channel hang)', () {
      fakeAsync((time) {
        when(
          () => mocks.nativeApi.getBaseResource('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
        ).thenAnswer((_) => Completer<BaseResource?>().future);

        EditPairPlan? plan;
        unawaited(resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30))).then((p) => plan = p));
        time.elapse(const Duration(minutes: 31));

        expect(plan, isA<DeferEditPair>());
      });
    });

    test('absorbs onto a live remote that already has the base bytes', () async {
      final basePath = tempFile('base.jpg');
      stubBase(base('base-sha1', path: basePath));
      when(
        () => mocks.stack.remoteByChecksum('base-sha1', 'owner-1'),
      ).thenAnswer((_) async => (state: PriorState.live, remoteId: 'remote-base'));

      final plan = await resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<AbsorbIntoPrior>().having((p) => p.parentId, 'parentId', 'remote-base'));
      // No point re-uploading bytes the server has; the temp copy is dropped.
      expect(File(basePath).existsSync(), isFalse);
    });

    test('defers while the server copy of the base sits in the trash', () async {
      final basePath = tempFile('base.jpg');
      stubBase(base('base-sha1', path: basePath));
      when(
        () => mocks.stack.remoteByChecksum('base-sha1', 'owner-1'),
      ).thenAnswer((_) async => (state: PriorState.trashed, remoteId: 'remote-base'));

      // Uploading would dedupe onto the trashed row and the stack would 400.
      final plan = await resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<DeferEditPair>());
      expect(File(basePath).existsSync(), isFalse);
    });

    test('defers when the duplicate-base lookup itself fails', () async {
      final basePath = tempFile('base.jpg');
      stubBase(base('base-sha1', path: basePath));
      when(() => mocks.stack.remoteByChecksum(any(), any())).thenThrow(Exception('db error'));

      final plan = await resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<DeferEditPair>());
      expect(File(basePath).existsSync(), isFalse);
    });

    test('skips the duplicate-base check when no owner is known', () async {
      stubBase(base('different-sha1'));

      final plan = await resolve(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)), ownerId: null);

      expect(plan, isA<UploadBaseFirst>());
      verifyNever(() => mocks.stack.remoteByChecksum(any(), any()));
    });
  });

  group('resolveEditPair live photos', () {
    test('uploads the original pair when a real edit moved the timestamp', () async {
      stubLive(BaseLivePhoto(still: base('still-sha1'), video: base('video-sha1')));

      final plan = await resolveLive(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(
        plan,
        isA<UploadBaseLivePhotoFirst>()
            .having((p) => p.still.sha1, 'still', 'still-sha1')
            .having((p) => p.video?.sha1, 'video', 'video-sha1'),
      );
      verify(() => mocks.nativeApi.getBaseLivePhoto('local-1', allowNetworkAccess: true)).called(1);
    });

    test('degrades to a still-only parent when the original has no paired video', () async {
      stubLive(BaseLivePhoto(still: base('still-sha1')));

      final plan = await resolveLive(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<UploadBaseLivePhotoFirst>().having((p) => p.video, 'video', isNull));
    });

    test('skips when the original pair is positively gone (native returned null)', () async {
      stubLive(null);

      final plan = await resolveLive(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<NoEditPair>());
    });

    test('skips a video-only edit whose still bytes are unchanged (no self-stack)', () async {
      // The base still matches the current asset, so it would dedupe to the edit itself.
      final stillPath = tempFile('still.heic');
      final videoPath = tempFile('paired.mov');
      stubLive(
        BaseLivePhoto(
          still: base('local-sha1', path: stillPath),
          video: base('video-sha1', path: videoPath),
        ),
      );

      final plan = await resolveLive(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<NoEditPair>());
      // Both temp copies are dropped, not leaked.
      expect(File(stillPath).existsSync(), isFalse);
      expect(File(videoPath).existsSync(), isFalse);
    });

    test('defers when reading the original pair throws', () async {
      when(
        () => mocks.nativeApi.getBaseLivePhoto('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenThrow(Exception('boom'));

      final plan = await resolveLive(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<DeferEditPair>());
    });

    test('does not touch native for a live photo inside the 2s style window', () async {
      final plan = await resolveLive(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 1)));

      expect(plan, isA<NoEditPair>());
      verifyNever(() => mocks.nativeApi.getBaseLivePhoto(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('defers a live photo whose prior remote sits in the server trash', () async {
      when(() => mocks.stack.priorState('remote-edit')).thenAnswer((_) async => PriorState.trashed);

      final plan = await resolveLive(
        asset(priorRemoteId: 'remote-edit', adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)),
      );

      expect(plan, isA<DeferEditPair>());
      verifyNever(() => mocks.nativeApi.getBaseLivePhoto(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('rebuilds the pair when a completed prior vanished from the server', () async {
      when(() => mocks.stack.priorState('remote-edit')).thenAnswer((_) async => PriorState.missing);
      stubLive(BaseLivePhoto(still: base('still-sha1'), video: base('video-sha1')));

      final plan = await resolveLive(
        asset(
          priorRemoteId: 'remote-edit',
          syncedChecksum: 'synced-sha1',
          adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30),
        ),
      );

      expect(plan, isA<UploadBaseLivePhotoFirst>());
      verify(() => mocks.nativeApi.getBaseLivePhoto('local-1', allowNetworkAccess: true)).called(1);
    });

    test('absorbs the prior remote for a re-edited live photo', () async {
      final plan = await resolveLive(
        asset(priorRemoteId: 'remote-edit', adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)),
      );

      expect(plan, isA<AbsorbIntoPrior>().having((p) => p.parentId, 'parentId', 'remote-edit'));
      verifyNever(() => mocks.nativeApi.getBaseLivePhoto(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('absorbs onto a live remote that already has the base still', () async {
      final stillPath = tempFile('still.heic');
      final videoPath = tempFile('paired.mov');
      stubLive(
        BaseLivePhoto(
          still: base('still-sha1', path: stillPath),
          video: base('video-sha1', path: videoPath),
        ),
      );
      when(
        () => mocks.stack.remoteByChecksum('still-sha1', 'owner-1'),
      ).thenAnswer((_) async => (state: PriorState.live, remoteId: 'remote-base'));

      final plan = await resolveLive(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<AbsorbIntoPrior>().having((p) => p.parentId, 'parentId', 'remote-base'));
      // Both temp copies are dropped, not leaked.
      expect(File(stillPath).existsSync(), isFalse);
      expect(File(videoPath).existsSync(), isFalse);
    });

    test('defers the pair while the server copy of the base still sits in the trash', () async {
      final stillPath = tempFile('still.heic');
      final videoPath = tempFile('paired.mov');
      stubLive(
        BaseLivePhoto(
          still: base('still-sha1', path: stillPath),
          video: base('video-sha1', path: videoPath),
        ),
      );
      when(
        () => mocks.stack.remoteByChecksum('still-sha1', 'owner-1'),
      ).thenAnswer((_) async => (state: PriorState.trashed, remoteId: 'remote-base'));

      final plan = await resolveLive(asset(adjustmentTime: DateTime(2025, 1, 1, 12, 0, 30)));

      expect(plan, isA<DeferEditPair>());
      expect(File(stillPath).existsSync(), isFalse);
      expect(File(videoPath).existsSync(), isFalse);
    });
  });
}
