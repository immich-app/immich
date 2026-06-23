import 'dart:async';

import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/edit_revert.service.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:mocktail/mocktail.dart';

import '../mocks.dart';

void main() {
  late EditRevertService sut;
  final mocks = RepositoryMocks();

  LocalAsset asset({String? priorRemoteId, String? checksum = 'reverted-sha1'}) => LocalAsset(
    id: 'local-1',
    name: 'photo.jpg',
    type: AssetType.image,
    createdAt: DateTime(2025),
    updatedAt: DateTime(2025, 2),
    playbackStyle: AssetPlaybackStyle.image,
    isEdited: false,
    priorRemoteId: priorRemoteId,
    checksum: checksum,
  );

  // Revert detected and the stack resolved: edit-state reads notEdited, the prior
  // remote sits in stack-1 whose base is remote-base.
  void stubRevertLookups() {
    when(
      () => mocks.nativeApi.getEditState('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
    ).thenAnswer((_) async => EditState.notEdited);
    when(() => mocks.stack.findStackIdByRemoteId('remote-edit')).thenAnswer((_) async => 'stack-1');
    when(() => mocks.stack.findStackBaseId('stack-1', excludeId: 'remote-edit')).thenAnswer((_) async => 'remote-base');
  }

  setUp(() {
    sut = EditRevertService(
      nativeSyncApi: mocks.nativeApi,
      stackRepository: mocks.stack,
      localAssetRepository: mocks.localAsset,
      assetApiRepository: mocks.assetApi,
    );
  });

  tearDown(() {
    mocks.reset();
  });

  group('tryHandleRevert', () {
    test('returns null when the asset was never uploaded as an edit', () async {
      expect(await sut.tryHandleRevert(asset(priorRemoteId: null)), isNull);
      verifyNever(() => mocks.nativeApi.getEditState(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('returns null (lets the pair flow run) when there is still a live edit', () async {
      when(
        () => mocks.nativeApi.getEditState('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => EditState.edited);

      expect(await sut.tryHandleRevert(asset(priorRemoteId: 'remote-edit')), isNull);
      verifyNever(() => mocks.stack.findStackIdByRemoteId(any()));
    });

    test('returns null when the edit state cannot be read (offloaded to iCloud)', () async {
      when(
        () => mocks.nativeApi.getEditState('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => EditState.unknown);

      expect(await sut.tryHandleRevert(asset(priorRemoteId: 'remote-edit')), isNull);
      verifyNever(() => mocks.stack.findStackIdByRemoteId(any()));
    });

    test('returns null when the edit-state probe hangs past 30s', () {
      fakeAsync((time) {
        when(
          () => mocks.nativeApi.getEditState('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
        ).thenAnswer((_) => Completer<EditState>().future);

        String? handled;
        var completed = false;
        unawaited(
          sut.tryHandleRevert(asset(priorRemoteId: 'remote-edit')).then((r) {
            handled = r;
            completed = true;
          }),
        );
        time.elapse(const Duration(seconds: 30));

        expect(completed, isTrue);
        expect(handled, isNull);
        verifyNever(() => mocks.stack.findStackIdByRemoteId(any()));
      });
    });

    test('returns null when the edit-state probe throws', () async {
      when(
        () => mocks.nativeApi.getEditState('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenThrow(Exception('plist read failed'));

      expect(await sut.tryHandleRevert(asset(priorRemoteId: 'remote-edit')), isNull);
      verifyNever(() => mocks.stack.findStackIdByRemoteId(any()));
    });

    test('returns null when the stack lookup throws', () async {
      when(
        () => mocks.nativeApi.getEditState('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => EditState.notEdited);
      when(() => mocks.stack.findStackIdByRemoteId('remote-edit')).thenThrow(Exception('db error'));

      expect(await sut.tryHandleRevert(asset(priorRemoteId: 'remote-edit')), isNull);
      verifyNever(() => mocks.assetApi.setStackPrimary(any(), any()));
    });

    test('returns null when the server primary flip throws', () async {
      stubRevertLookups();
      when(() => mocks.assetApi.setStackPrimary('stack-1', 'remote-base')).thenThrow(Exception('500'));

      expect(await sut.tryHandleRevert(asset(priorRemoteId: 'remote-edit')), isNull);
      // No local writes when the server never flipped.
      verifyNever(() => mocks.stack.setPrimary(any(), any()));
      verifyNever(
        () => mocks.localAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('returns the base id when the server flip succeeds but the local writes throw', () async {
      stubRevertLookups();
      when(() => mocks.assetApi.setStackPrimary('stack-1', 'remote-base')).thenAnswer((_) async {});
      when(() => mocks.stack.setPrimary('stack-1', 'remote-base')).thenThrow(Exception('db locked'));

      // The server flip is what handles the revert; local state heals on next sync.
      expect(await sut.tryHandleRevert(asset(priorRemoteId: 'remote-edit')), 'remote-base');

      verify(() => mocks.assetApi.setStackPrimary('stack-1', 'remote-base')).called(1);
      verifyNever(
        () => mocks.localAsset.markSynced(
          any(),
          priorRemoteId: any(named: 'priorRemoteId'),
          syncedChecksum: any(named: 'syncedChecksum'),
        ),
      );
    });

    test('returns null when the prior remote is not in a stack', () async {
      when(
        () => mocks.nativeApi.getEditState('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => EditState.notEdited);
      when(() => mocks.stack.findStackIdByRemoteId('remote-edit')).thenAnswer((_) async => null);

      expect(await sut.tryHandleRevert(asset(priorRemoteId: 'remote-edit')), isNull);
      verifyNever(() => mocks.assetApi.setStackPrimary(any(), any()));
    });

    test('returns null when the stack has no base member to flip back to', () async {
      when(
        () => mocks.nativeApi.getEditState('local-1', allowNetworkAccess: any(named: 'allowNetworkAccess')),
      ).thenAnswer((_) async => EditState.notEdited);
      when(() => mocks.stack.findStackIdByRemoteId('remote-edit')).thenAnswer((_) async => 'stack-1');
      when(() => mocks.stack.findStackBaseId('stack-1', excludeId: 'remote-edit')).thenAnswer((_) async => null);

      expect(await sut.tryHandleRevert(asset(priorRemoteId: 'remote-edit')), isNull);
      verifyNever(() => mocks.assetApi.setStackPrimary(any(), any()));
    });

    test('flips the primary back to the base via prior_remote_id and keeps the edit (no trash)', () async {
      stubRevertLookups();
      when(() => mocks.assetApi.setStackPrimary('stack-1', 'remote-base')).thenAnswer((_) async {});
      when(() => mocks.stack.setPrimary('stack-1', 'remote-base')).thenAnswer((_) async {});
      when(
        () => mocks.localAsset.markSynced('local-1', priorRemoteId: 'remote-base', syncedChecksum: 'reverted-sha1'),
      ).thenAnswer((_) async {});

      // Success reports the base the cover flipped back to.
      expect(await sut.tryHandleRevert(asset(priorRemoteId: 'remote-edit')), 'remote-base');

      verify(() => mocks.assetApi.setStackPrimary('stack-1', 'remote-base')).called(1);
      verify(() => mocks.stack.setPrimary('stack-1', 'remote-base')).called(1);
      // The synced checksum is exactly the reverted render's checksum.
      verify(
        () => mocks.localAsset.markSynced('local-1', priorRemoteId: 'remote-base', syncedChecksum: 'reverted-sha1'),
      ).called(1);
      // Nothing is trashed or unstacked; every edit stays in the stack.
      verifyNever(() => mocks.assetApi.delete(any(), any()));
      verifyNever(() => mocks.assetApi.unStack(any()));
    });

    test('handles a revert on a live-photo-shaped asset the same way', () async {
      // Same flow regardless of media shape; the service never branches on type.
      final live = LocalAsset(
        id: 'local-1',
        name: 'live.heic',
        type: AssetType.image,
        createdAt: DateTime(2025),
        updatedAt: DateTime(2025, 2),
        durationMs: 2800,
        playbackStyle: AssetPlaybackStyle.livePhoto,
        isEdited: false,
        priorRemoteId: 'remote-edit',
        checksum: 'reverted-sha1',
      );
      stubRevertLookups();
      when(() => mocks.assetApi.setStackPrimary('stack-1', 'remote-base')).thenAnswer((_) async {});
      when(() => mocks.stack.setPrimary('stack-1', 'remote-base')).thenAnswer((_) async {});
      when(
        () => mocks.localAsset.markSynced('local-1', priorRemoteId: 'remote-base', syncedChecksum: 'reverted-sha1'),
      ).thenAnswer((_) async {});

      expect(await sut.tryHandleRevert(live), 'remote-base');

      verify(
        () => mocks.localAsset.markSynced('local-1', priorRemoteId: 'remote-base', syncedChecksum: 'reverted-sha1'),
      ).called(1);
    });
  });
}
