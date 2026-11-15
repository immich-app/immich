import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/background_worker.service.dart';
import 'package:immich_mobile/platform/background_worker_api.g.dart';
import 'package:immich_mobile/platform/background_worker_lock_api.g.dart';
import 'package:immich_mobile/platform/connectivity_api.g.dart';
import 'package:immich_mobile/platform/local_image_api.g.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/network_api.g.dart';
import 'package:immich_mobile/platform/passkey_api.g.dart';
import 'package:immich_mobile/platform/permission_api.g.dart';
import 'package:immich_mobile/platform/remote_image_api.g.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';

final backgroundWorkerFgServiceProvider = Provider((_) => BackgroundWorkerFgService(BackgroundWorkerFgHostApi()));

final backgroundWorkerLockServiceProvider = Provider<BackgroundWorkerLockService>(
  (_) => BackgroundWorkerLockService(BackgroundWorkerLockApi()),
);

final nativeSyncApiProvider = Provider<NativeSyncApi>((_) => NativeSyncApi());

final permissionApiProvider = Provider<PermissionApi>((_) => PermissionApi());

final connectivityApiProvider = Provider<ConnectivityApi>((_) => ConnectivityApi());

final passkeyHostApiProvider = Provider<PasskeyHostApi>((_) => PasskeyHostApi());

final localImageApi = LocalImageApi();

final remoteImageApi = RemoteImageApi();

final networkApi = NetworkApi();

/// Native streaming uploads report progress through a Pigeon FlutterApi. The
/// handler is registered once at startup; [UploadRepository] routes events to
/// the upload that owns the key.
class StreamingUploadProgressHandler implements StreamingUploadProgressApi {
  @override
  void onProgress(String progressKey, int transferred, int total) {
    UploadRepository.dispatchStreamingProgress(progressKey, transferred, total);
  }
}
