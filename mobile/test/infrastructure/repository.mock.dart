import 'package:immich_mobile/domain/interfaces/album_media.interface.dart';
import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/interfaces/user_api.interface.dart';
import 'package:mocktail/mocktail.dart';

class MockStoreRepository extends Mock implements IStoreRepository {}

class MockLogRepository extends Mock implements ILogRepository {}

class MockUserRepository extends Mock implements IUserRepository {}

class MockDeviceAssetRepository extends Mock
    implements IDeviceAssetRepository {}

class MockSyncStreamRepository extends Mock implements ISyncStreamRepository {}

class MockLocalAssetRepository extends Mock implements ILocalAssetRepository {}

class MockLocalAlbumRepository extends Mock implements ILocalAlbumRepository {}

class MockAlbumMediaRepository extends Mock implements IAlbumMediaRepository {}

// API Repos
class MockUserApiRepository extends Mock implements IUserApiRepository {}

class MockSyncApiRepository extends Mock implements ISyncApiRepository {}
