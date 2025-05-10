import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/platform/messages.g.dart';
import 'package:mocktail/mocktail.dart';
import 'package:platform/platform.dart';

class MockStoreService extends Mock implements StoreService {}

class MockUserService extends Mock implements UserService {}

class MockBackgroundSyncManager extends Mock implements BackgroundSyncManager {}

class MockHostService extends Mock implements ImHostService {}

class MockPlatform extends Mock implements Platform {}
