import 'package:immich_mobile/infrastructure/repositories/device_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user_api.repository.dart';
import 'package:mocktail/mocktail.dart';

class MockStoreRepository extends Mock implements IsarStoreRepository {}

class MockLogRepository extends Mock implements IsarLogRepository {}

class MockIsarUserRepository extends Mock implements IsarUserRepository {}

class MockDeviceAssetRepository extends Mock
    implements IsarDeviceAssetRepository {}

class MockSyncStreamRepository extends Mock implements SyncStreamRepository {}

class MockLocalAlbumRepository extends Mock
    implements DriftLocalAlbumRepository {}

class MockLocalAssetRepository extends Mock
    implements DriftLocalAssetRepository {}

class MockStorageRepository extends Mock implements StorageRepository {}

// API Repos
class MockUserApiRepository extends Mock implements UserApiRepository {}

class MockSyncApiRepository extends Mock implements SyncApiRepository {}
