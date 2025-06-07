import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:mocktail/mocktail.dart';

class MockStoreService extends Mock implements StoreService {}

class MockUserService extends Mock implements UserService {}

class MockBackgroundSyncManager extends Mock implements BackgroundSyncManager {}

class MockNativeSyncApi extends Mock implements NativeSyncApi {}
