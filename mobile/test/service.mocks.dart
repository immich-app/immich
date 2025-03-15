import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/entity.service.dart';
import 'package:immich_mobile/services/hash.service.dart';
import 'package:immich_mobile/services/network.service.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

class MockApiService extends Mock implements ApiService {}

class MockSyncService extends Mock implements SyncService {}

class MockHashService extends Mock implements HashService {}

class MockEntityService extends Mock implements EntityService {}

class MockNetworkService extends Mock implements NetworkService {}

class MockSearchApi extends Mock implements SearchApi {}
