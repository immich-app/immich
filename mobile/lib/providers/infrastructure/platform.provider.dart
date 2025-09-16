import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/background_worker.service.dart';
import 'package:immich_mobile/platform/background_worker_api.g.dart';
import 'package:immich_mobile/platform/connectivity_api.g.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/thumbnail_api.g.dart';

final backgroundWorkerFgServiceProvider = Provider((_) => BackgroundWorkerFgService(BackgroundWorkerFgHostApi()));

final nativeSyncApiProvider = Provider<NativeSyncApi>((_) => NativeSyncApi());

final connectivityApiProvider = Provider<ConnectivityApi>((_) => ConnectivityApi());

final thumbnailApi = ThumbnailApi();
