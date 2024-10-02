import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/entity.service.dart';
import 'package:immich_mobile/services/hash.service.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:immich_mobile/services/user.service.dart';
import 'package:mocktail/mocktail.dart';

class MockApiService extends Mock implements ApiService {}

class MockUserService extends Mock implements UserService {}

class MockSyncService extends Mock implements SyncService {}

class MockHashService extends Mock implements HashService {}

class MockEntityService extends Mock implements EntityService {}
