import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/asset_upload_coordinator.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/view_intent/active_view_intent_payload_provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
import 'package:mocktail/mocktail.dart';

import '../service.mocks.dart';
import '../unit/factories/local_asset_factory.dart';
import '../unit/factories/remote_asset_factory.dart';

class MockViewIntentService extends Mock implements ViewIntentService {}

void main() {
  late ProviderContainer container;
  late MockForegroundUploadService uploadService;
  late MockAssetService assetService;
  late MockViewIntentService viewIntentService;

  setUpAll(() {
    registerFallbackValue(LocalAssetFactory.create());
    registerFallbackValue(const UploadCallbacks());
  });

  setUp(() {
    uploadService = MockForegroundUploadService();
    assetService = MockAssetService();
    viewIntentService = MockViewIntentService();

    when(() => assetService.watchAsset(any())).thenAnswer((_) => const Stream.empty());

    container = ProviderContainer(
      overrides: [
        foregroundUploadServiceProvider.overrideWithValue(uploadService),
        assetServiceProvider.overrideWithValue(assetService),
        viewIntentServiceProvider.overrideWithValue(viewIntentService),
      ],
    );
    addTearDown(container.dispose);
  });

  test('replaces a device-backed viewer asset after upload when the local database cannot link it', () async {
    final localAsset = LocalAssetFactory.create(id: 'local-outside-backup');
    final remoteAsset = RemoteAssetFactory.create(id: 'remote-outside-backup');

    container.read(assetViewerProvider.notifier).setAsset(localAsset);
    when(() => assetService.watchRemoteAsset(remoteAsset.id)).thenAnswer((_) => Stream.value(remoteAsset));
    when(
      () => uploadService.uploadManual(
        any(),
        cancelToken: any(named: 'cancelToken'),
        callbacks: any(named: 'callbacks'),
      ),
    ).thenAnswer((invocation) async {
      final callbacks = invocation.namedArguments[#callbacks] as UploadCallbacks;
      callbacks.onSuccess?.call(localAsset.id, remoteAsset.id);
    });

    await container
        .read(assetUploadCoordinatorProvider)
        .upload(
          source: ActionSource.viewer,
          assets: [localAsset],
          cancelToken: Completer<void>(),
          callbacks: const UploadCallbacks(),
        );

    final currentAsset = container.read(assetViewerProvider).currentAsset;
    expect(currentAsset, isA<RemoteAsset>());
    expect(currentAsset?.remoteId, remoteAsset.id);
    expect(currentAsset?.localId, localAsset.id);
    expect(currentAsset?.isMerged, isTrue);
  });

  test('does not let a device-backed upload from an older view intent replace the viewer', () async {
    final oldPayload = ViewIntentPayload(path: '/tmp/old.jpg', mimeType: 'image/jpeg', localAssetId: 'local-old');
    final newPayload = ViewIntentPayload(path: '/tmp/new.jpg', mimeType: 'image/jpeg', localAssetId: 'local-new');
    final localAsset = LocalAssetFactory.create(id: 'local-old');
    final remoteAsset = RemoteAssetFactory.create(id: 'remote-old');
    final remoteController = StreamController<RemoteAsset?>.broadcast();
    addTearDown(remoteController.close);

    container.read(activeViewIntentPayloadProvider.notifier).setPayload(oldPayload);
    container.read(assetViewerProvider.notifier).setAsset(localAsset);
    when(() => assetService.watchRemoteAsset(remoteAsset.id)).thenAnswer((_) => remoteController.stream);
    when(
      () => uploadService.uploadManual(
        any(),
        cancelToken: any(named: 'cancelToken'),
        callbacks: any(named: 'callbacks'),
      ),
    ).thenAnswer((invocation) async {
      final callbacks = invocation.namedArguments[#callbacks] as UploadCallbacks;
      callbacks.onSuccess?.call(localAsset.id, remoteAsset.id);
    });

    final upload = container
        .read(assetUploadCoordinatorProvider)
        .upload(
          source: ActionSource.viewer,
          assets: [localAsset],
          cancelToken: Completer<void>(),
          callbacks: const UploadCallbacks(),
        );
    await pumpEventQueue();

    container.read(activeViewIntentPayloadProvider.notifier).setPayload(newPayload);
    remoteController.add(remoteAsset);
    await upload;

    expect(container.read(assetViewerProvider).currentAsset, same(localAsset));
  });

  test('uploads a path-only viewer asset as a file and replaces it with the synchronized remote asset', () async {
    const path = 'C:/cache/view_intent_1.jpg';
    final localAsset = LocalAssetFactory.create(id: '-1');
    final remoteAsset = RemoteAssetFactory.create(id: 'remote-1');
    final progress = <(String, int, int)>[];
    final succeeded = <(String, String)>[];

    container.read(viewIntentFilePathProvider.notifier).setPath(path);
    container.read(assetViewerProvider.notifier).setAsset(localAsset);

    when(() => viewIntentService.markUploadActive(path)).thenReturn(null);
    when(() => viewIntentService.cleanupManagedTempFileIfCurrent(path)).thenAnswer((_) async {});
    when(() => viewIntentService.markUploadInactive(path)).thenAnswer((_) async {});
    when(() => assetService.watchRemoteAsset('remote-1')).thenAnswer((_) => Stream.value(remoteAsset));
    when(
      () => uploadService.uploadShareIntent(
        any(),
        cancelToken: any(named: 'cancelToken'),
        onProgress: any(named: 'onProgress'),
        onSuccess: any(named: 'onSuccess'),
        onError: any(named: 'onError'),
      ),
    ).thenAnswer((invocation) async {
      final onProgress = invocation.namedArguments[#onProgress] as void Function(String, int, int)?;
      final onSuccess = invocation.namedArguments[#onSuccess] as void Function(String, String)?;
      onProgress?.call('file-id', 5, 10);
      onSuccess?.call('file-id', 'remote-1');
    });

    await container
        .read(assetUploadCoordinatorProvider)
        .upload(
          source: ActionSource.viewer,
          assets: [localAsset],
          cancelToken: Completer<void>(),
          callbacks: UploadCallbacks(
            onProgress: (id, _, bytes, total) => progress.add((id, bytes, total)),
            onSuccess: (localId, remoteId) => succeeded.add((localId, remoteId)),
          ),
        );

    final files =
        verify(
              () => uploadService.uploadShareIntent(
                captureAny(),
                cancelToken: any(named: 'cancelToken'),
                onProgress: any(named: 'onProgress'),
                onSuccess: any(named: 'onSuccess'),
                onError: any(named: 'onError'),
              ),
            ).captured.single
            as List<File>;
    expect(files.single.path, path);
    expect(progress, [(localAsset.id, 5, 10)]);
    expect(succeeded, [(localAsset.id, remoteAsset.id)]);
    expect(container.read(assetViewerProvider).currentAsset, remoteAsset);
    expect(container.read(viewIntentFilePathProvider), isNull);
    verify(() => viewIntentService.markUploadActive(path)).called(1);
    verify(() => viewIntentService.cleanupManagedTempFileIfCurrent(path)).called(1);
    verify(() => viewIntentService.markUploadInactive(path)).called(1);
    verifyNever(
      () => uploadService.uploadManual(
        any(),
        cancelToken: any(named: 'cancelToken'),
        callbacks: any(named: 'callbacks'),
      ),
    );
  });

  test('keeps the path-only asset current when the upload is cancelled', () async {
    const path = 'C:/cache/view_intent_cancelled.jpg';
    final localAsset = LocalAssetFactory.create(id: '-2');
    final cancelToken = Completer<void>();

    container.read(viewIntentFilePathProvider.notifier).setPath(path);
    container.read(assetViewerProvider.notifier).setAsset(localAsset);
    when(() => viewIntentService.markUploadActive(path)).thenReturn(null);
    when(() => viewIntentService.markUploadInactive(path)).thenAnswer((_) async {});
    when(
      () => uploadService.uploadShareIntent(
        any(),
        cancelToken: cancelToken,
        onProgress: any(named: 'onProgress'),
        onSuccess: any(named: 'onSuccess'),
        onError: any(named: 'onError'),
      ),
    ).thenAnswer((invocation) async {
      cancelToken.complete();
      final onSuccess = invocation.namedArguments[#onSuccess] as void Function(String, String)?;
      onSuccess?.call('file-id', 'remote-cancelled');
    });

    await container
        .read(assetUploadCoordinatorProvider)
        .upload(
          source: ActionSource.viewer,
          assets: [localAsset],
          cancelToken: cancelToken,
          callbacks: const UploadCallbacks(),
        );

    expect(container.read(assetViewerProvider).currentAsset, localAsset);
    expect(container.read(viewIntentFilePathProvider), path);
    verifyNever(() => assetService.watchRemoteAsset('remote-cancelled'));
    verifyNever(() => viewIntentService.cleanupManagedTempFileIfCurrent(path));
    verify(() => viewIntentService.markUploadInactive(path)).called(1);
  });

  test('reports a file upload error under the synthetic asset id and keeps the source file', () async {
    const path = 'C:/cache/view_intent_failed.jpg';
    final localAsset = LocalAssetFactory.create(id: '-5');
    final errors = <(String, String)>[];

    container.read(viewIntentFilePathProvider.notifier).setPath(path);
    container.read(assetViewerProvider.notifier).setAsset(localAsset);
    when(() => viewIntentService.markUploadActive(path)).thenReturn(null);
    when(() => viewIntentService.markUploadInactive(path)).thenAnswer((_) async {});
    when(
      () => uploadService.uploadShareIntent(
        any(),
        cancelToken: any(named: 'cancelToken'),
        onProgress: any(named: 'onProgress'),
        onSuccess: any(named: 'onSuccess'),
        onError: any(named: 'onError'),
      ),
    ).thenAnswer((invocation) async {
      final onError = invocation.namedArguments[#onError] as void Function(String, String)?;
      onError?.call('file-id', 'boom');
    });

    await container
        .read(assetUploadCoordinatorProvider)
        .upload(
          source: ActionSource.viewer,
          assets: [localAsset],
          cancelToken: Completer<void>(),
          callbacks: UploadCallbacks(onError: (id, error) => errors.add((id, error))),
        );

    expect(errors, [(localAsset.id, 'boom')]);
    expect(container.read(assetViewerProvider).currentAsset, localAsset);
    expect(container.read(viewIntentFilePathProvider), path);
    verifyNever(() => viewIntentService.cleanupManagedTempFileIfCurrent(path));
    verify(() => viewIntentService.markUploadInactive(path)).called(1);
  });

  test('does not let an older upload replace a newer view intent', () async {
    const oldPath = 'C:/cache/view_intent_old.jpg';
    const newPath = 'C:/cache/view_intent_new.jpg';
    final oldAsset = LocalAssetFactory.create(id: '-3');
    final newAsset = LocalAssetFactory.create(id: '-4');
    final uploadedRemote = RemoteAssetFactory.create(id: 'remote-old');
    final remoteController = StreamController<RemoteAsset?>.broadcast();
    addTearDown(remoteController.close);

    container.read(viewIntentFilePathProvider.notifier).setPath(oldPath);
    container.read(assetViewerProvider.notifier).setAsset(oldAsset);
    when(() => viewIntentService.markUploadActive(oldPath)).thenReturn(null);
    when(() => viewIntentService.markUploadInactive(oldPath)).thenAnswer((_) async {});
    when(() => assetService.watchRemoteAsset(uploadedRemote.id)).thenAnswer((_) => remoteController.stream);
    when(
      () => uploadService.uploadShareIntent(
        any(),
        cancelToken: any(named: 'cancelToken'),
        onProgress: any(named: 'onProgress'),
        onSuccess: any(named: 'onSuccess'),
        onError: any(named: 'onError'),
      ),
    ).thenAnswer((invocation) async {
      final onSuccess = invocation.namedArguments[#onSuccess] as void Function(String, String)?;
      onSuccess?.call('file-id', uploadedRemote.id);
    });

    final upload = container
        .read(assetUploadCoordinatorProvider)
        .upload(
          source: ActionSource.viewer,
          assets: [oldAsset],
          cancelToken: Completer<void>(),
          callbacks: const UploadCallbacks(),
        );
    await pumpEventQueue();

    container.read(viewIntentFilePathProvider.notifier).setPath(newPath);
    container.read(assetViewerProvider.notifier).setAsset(newAsset);
    remoteController.add(uploadedRemote);
    await upload;

    expect(container.read(assetViewerProvider).currentAsset, newAsset);
    expect(container.read(viewIntentFilePathProvider), newPath);
    verifyNever(() => viewIntentService.cleanupManagedTempFileIfCurrent(oldPath));
    verify(() => viewIntentService.markUploadInactive(oldPath)).called(1);
  });

  test('does not let an older file upload replace a newer session for the same asset', () async {
    const path = 'C:/cache/view_intent_same.jpg';
    final oldPayload = ViewIntentPayload(path: path, mimeType: 'image/jpeg');
    final newPayload = ViewIntentPayload(path: path, mimeType: 'image/jpeg');
    final localAsset = LocalAssetFactory.create(id: '-6');
    final uploadedRemote = RemoteAssetFactory.create(id: 'remote-same');
    final remoteController = StreamController<RemoteAsset?>.broadcast();
    addTearDown(remoteController.close);

    container.read(activeViewIntentPayloadProvider.notifier).setPayload(oldPayload);
    container.read(viewIntentFilePathProvider.notifier).setPath(path);
    container.read(assetViewerProvider.notifier).setAsset(localAsset);
    when(() => viewIntentService.markUploadActive(path)).thenReturn(null);
    when(() => viewIntentService.cleanupManagedTempFileIfCurrent(path)).thenAnswer((_) async {});
    when(() => viewIntentService.markUploadInactive(path)).thenAnswer((_) async {});
    when(() => assetService.watchRemoteAsset(uploadedRemote.id)).thenAnswer((_) => remoteController.stream);
    when(
      () => uploadService.uploadShareIntent(
        any(),
        cancelToken: any(named: 'cancelToken'),
        onProgress: any(named: 'onProgress'),
        onSuccess: any(named: 'onSuccess'),
        onError: any(named: 'onError'),
      ),
    ).thenAnswer((invocation) async {
      final onSuccess = invocation.namedArguments[#onSuccess] as void Function(String, String)?;
      onSuccess?.call('file-id', uploadedRemote.id);
    });

    final upload = container
        .read(assetUploadCoordinatorProvider)
        .upload(
          source: ActionSource.viewer,
          assets: [localAsset],
          cancelToken: Completer<void>(),
          callbacks: const UploadCallbacks(),
        );
    await pumpEventQueue();

    container.read(activeViewIntentPayloadProvider.notifier).setPayload(newPayload);
    remoteController.add(uploadedRemote);
    await upload;

    expect(container.read(assetViewerProvider).currentAsset, same(localAsset));
    expect(container.read(viewIntentFilePathProvider), path);
    verifyNever(() => viewIntentService.cleanupManagedTempFileIfCurrent(path));
  });
}
