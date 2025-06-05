import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';

final nativeSyncApiProvider = Provider<NativeSyncApi>((_) => NativeSyncApi());
