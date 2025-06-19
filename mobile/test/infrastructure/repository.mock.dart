import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/storage.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:immich_mobile/domain/interfaces/user_api.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:mocktail/mocktail.dart';

class MockStoreRepository extends Mock implements IStoreRepository {}

class MockLogRepository extends Mock implements ILogRepository {}

class MockIsarUserRepository extends Mock implements IsarUserRepository {}

class MockDeviceAssetRepository extends Mock
    implements IDeviceAssetRepository {}

class MockSyncStreamRepository extends Mock implements ISyncStreamRepository {}

class MockLocalAlbumRepository extends Mock implements ILocalAlbumRepository {}

class MockLocalAssetRepository extends Mock implements ILocalAssetRepository {}

class MockStorageRepository extends Mock implements IStorageRepository {}

// API Repos
class MockUserApiRepository extends Mock implements IUserApiRepository {}

class MockSyncApiRepository extends Mock implements ISyncApiRepository {}
